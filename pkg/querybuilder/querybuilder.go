// Package querybuilder provides the small, PostgreSQL SELECT builder used by
// dynamic service queries. Table and column values are generated from sqlc's
// catalog; this package only contains the SQL composition machinery.
package querybuilder

import (
	"fmt"
	"strings"

	"github.com/gofrs/uuid"
)

type writer struct {
	strings.Builder
	args []any
}

func (w *writer) arg(v any) { w.args = append(w.args, v); fmt.Fprintf(&w.Builder, "$%d", len(w.args)) }

// Expression is implemented by every SQL expression and generated column.
type Expression interface{ writeSQL(*writer) }
type TypedExpression[T any] interface {
	Expression
	expressionType() T
}
type Projection = Expression
type ReadableTable = TableExpr
type SelectTable = TableExpr
type BoolExpression = Expr[bool]
type StringExpression = Expr[string]
type IntegerExpression = Expr[int]
type OrderByClause = Order
type expression struct{ fn func(*writer) }

func (e expression) writeSQL(w *writer) { e.fn(w) }

// Expr is an expression whose Go value type is T.
type Expr[T any] struct{ expression }

func (Expr[T]) expressionType() T                                     { var zero T; return zero }
func Value[T any](v T) Expr[T]                                        { return Expr[T]{expression{func(w *writer) { w.arg(v) }}} }
func (e Expr[T]) EQ[R TypedExpression[T]](rhs R) Expr[bool]           { return binary(e, " = ", rhs) }
func (e Expr[T]) NOT_EQ[R TypedExpression[T]](rhs R) Expr[bool]       { return binary(e, " <> ", rhs) }
func (e Expr[T]) GT[R TypedExpression[T]](rhs R) Expr[bool]           { return binary(e, " > ", rhs) }
func (e Expr[T]) LT[R TypedExpression[T]](rhs R) Expr[bool]           { return binary(e, " < ", rhs) }
func (e Expr[T]) IN[R TypedExpression[T]](values ...R) Expr[bool]     { return in(e, false, values) }
func (e Expr[T]) NOT_IN[R TypedExpression[T]](values ...R) Expr[bool] { return in(e, true, values) }
func (e Expr[T]) Coalesce[R TypedExpression[T]](fallback R) Expr[T] {
	return typedBinary(e, "COALESCE(", ", ", ")", fallback)
}
func (e Expr[T]) IS_NULL() Expr[bool]      { return unary(e, " IS NULL") }
func (e Expr[T]) IS_NOT_NULL() Expr[bool]  { return unary(e, " IS NOT NULL") }
func (e Expr[T]) AS(alias string) Alias[T] { return Alias[T]{source: e, name: alias} }
func (e Expr[T]) ASC() Order               { return Order{expr: e} }
func (e Expr[T]) DESC() Order              { return Order{expr: e, desc: true} }

func binary[T any, L, R TypedExpression[T]](l L, op string, r R) Expr[bool] {
	return Expr[bool]{expression{func(w *writer) { l.writeSQL(w); w.WriteString(op); r.writeSQL(w) }}}
}
func typedBinary[T any, L, R TypedExpression[T]](l L, prefix, separator, suffix string, r R) Expr[T] {
	return Expr[T]{expression{func(w *writer) {
		w.WriteString(prefix)
		l.writeSQL(w)
		w.WriteString(separator)
		r.writeSQL(w)
		w.WriteString(suffix)
	}}}
}
func unary[T any](e Expr[T], suffix string) Expr[bool] {
	return Expr[bool]{expression{func(w *writer) { e.writeSQL(w); w.WriteString(suffix) }}}
}
func in[T any, L TypedExpression[T], R TypedExpression[T]](e L, not bool, values []R) Expr[bool] {
	return Expr[bool]{expression{func(w *writer) {
		e.writeSQL(w)
		if not {
			w.WriteString(" NOT")
		}
		w.WriteString(" IN (")
		for i, v := range values {
			if i > 0 {
				w.WriteString(", ")
			}
			v.writeSQL(w)
		}
		w.WriteByte(')')
	}}}
}

// Alias is a typed name assigned to a projection in a derived table.
type Alias[T any] struct {
	source TypedExpression[T]
	name   string
}

func (a Alias[T]) writeSQL(w *writer) { a.source.writeSQL(w); w.WriteString(" AS "); quote(w, a.name) }
func (Alias[T]) expressionType() T    { var zero T; return zero }

// Column is a schema-derived, typed column reference.
type Column[T any] struct {
	Expr[T]
	Table, Name string
}

func NewColumn[T any](table, name string) Column[T] {
	c := Column[T]{Table: table, Name: name}
	c.Expr = Expr[T]{expression{func(w *writer) { quote(w, table); w.WriteByte('.'); quote(w, name) }}}
	return c
}

type Table struct{ Name, Alias string }

func NewTable(name string) Table { return Table{Name: name} }
func (t Table) writeTable(w *writer) {
	quote(w, t.Name)
	if t.Alias != "" {
		w.WriteString(" AS ")
		quote(w, t.Alias)
	}
}
func (t Table) Qualifier() string {
	if t.Alias != "" {
		return t.Alias
	}
	return t.Name
}
func (t Table) tableQualifier() string { return t.Qualifier() }

type TableExpr interface {
	writeTable(*writer)
	tableQualifier() string
	INNER_JOIN(TableExpr, Expr[bool]) TableExpr
}

func (t Table) INNER_JOIN(other TableExpr, on Expr[bool]) TableExpr {
	return joinedTable{left: t, joins: []join{{"INNER JOIN", other, on}}}
}

type joinedTable struct {
	left  TableExpr
	joins []join
}

func (t joinedTable) writeTable(w *writer) {
	t.left.writeTable(w)
	for _, j := range t.joins {
		w.WriteByte(' ')
		w.WriteString(j.kind)
		w.WriteByte(' ')
		j.table.writeTable(w)
		w.WriteString(" ON ")
		j.on.writeSQL(w)
	}
}
func (t joinedTable) tableQualifier() string { return t.left.tableQualifier() }
func (t joinedTable) INNER_JOIN(other TableExpr, on Expr[bool]) TableExpr {
	t.joins = append(t.joins, join{"INNER JOIN", other, on})
	return t
}

type join struct {
	kind  string
	table TableExpr
	on    Expr[bool]
}
type Order struct {
	expr            Expression
	desc, nullsLast bool
}

func (o Order) NULLS_LAST() Order { o.nullsLast = true; return o }
func Asc(e Expression) Order      { return Order{expr: e} }
func Desc(e Expression) Order     { return Order{expr: e, desc: true} }

type Builder struct {
	projection    []Expression
	from          TableExpr
	joins         []join
	where         []Expr[bool]
	groupBy       []Expression
	having        []Expr[bool]
	orderBy       []Order
	limit, offset *int64
	distinct      bool
}

func Select(first Expression, rest ...Expression) *Builder {
	return &Builder{projection: append([]Expression{first}, rest...)}
}
func (b *Builder) From(t TableExpr) *Builder { b.from = t; return b }
func (b *Builder) Join(t TableExpr, on Expr[bool]) *Builder {
	b.joins = append(b.joins, join{"INNER JOIN", t, on})
	return b
}
func (b *Builder) LeftJoin(t TableExpr, on Expr[bool]) *Builder {
	b.joins = append(b.joins, join{"LEFT JOIN", t, on})
	return b
}
func (b *Builder) Where(e ...Expr[bool]) *Builder    { b.where = append(b.where, e...); return b }
func (b *Builder) GroupBy(e ...Expression) *Builder  { b.groupBy = append(b.groupBy, e...); return b }
func (b *Builder) Having(e ...Expr[bool]) *Builder   { b.having = append(b.having, e...); return b }
func (b *Builder) OrderBy(e ...Order) *Builder       { b.orderBy = append(b.orderBy, e...); return b }
func (b *Builder) Distinct() *Builder                { b.distinct = true; return b }
func (b *Builder) Limit(v int64) *Builder            { b.limit = &v; return b }
func (b *Builder) Offset(v int64) *Builder           { b.offset = &v; return b }
func (b *Builder) As(alias string) DerivedTable      { return DerivedTable{b, alias} }
func (b *Builder) Statement() *Builder               { return b }
func (b *Builder) AsTable(alias string) DerivedTable { return b.As(alias) }
func (b *Builder) Sql() (string, []any) {
	sql, args, err := b.SQL()
	if err != nil {
		panic(err)
	}
	return sql, args
}
func (b *Builder) SQL() (string, []any, error) {
	w := &writer{}
	if err := b.writeSelect(w); err != nil {
		return "", nil, err
	}
	return w.String(), w.args, nil
}
func (b *Builder) writeSelect(w *writer) error {
	if len(b.projection) == 0 || b.from == nil {
		return fmt.Errorf("querybuilder: SELECT requires a projection and FROM")
	}
	w.WriteString("SELECT ")
	if b.distinct {
		w.WriteString("DISTINCT ")
	}
	writeExprs(w, b.projection)
	w.WriteString(" FROM ")
	b.from.writeTable(w)
	for _, j := range b.joins {
		w.WriteByte(' ')
		w.WriteString(j.kind)
		w.WriteByte(' ')
		j.table.writeTable(w)
		w.WriteString(" ON ")
		j.on.writeSQL(w)
	}
	if len(b.where) > 0 {
		w.WriteString(" WHERE ")
		writeBools(w, b.where, " AND ")
	}
	if len(b.groupBy) > 0 {
		w.WriteString(" GROUP BY ")
		writeExprs(w, b.groupBy)
	}
	if len(b.having) > 0 {
		w.WriteString(" HAVING ")
		writeBools(w, b.having, " AND ")
	}
	if len(b.orderBy) > 0 {
		w.WriteString(" ORDER BY ")
		for i, o := range b.orderBy {
			if i > 0 {
				w.WriteString(", ")
			}
			o.expr.writeSQL(w)
			if o.desc {
				w.WriteString(" DESC")
			} else {
				w.WriteString(" ASC")
			}
			if o.nullsLast {
				w.WriteString(" NULLS LAST")
			}
		}
	}
	if b.limit != nil {
		w.WriteString(" LIMIT ")
		w.arg(*b.limit)
	}
	if b.offset != nil {
		w.WriteString(" OFFSET ")
		w.arg(*b.offset)
	}
	return nil
}

type DerivedTable struct {
	b     *Builder
	alias string
}

func (s DerivedTable) writeTable(w *writer) {
	w.WriteByte('(')
	_ = s.b.writeSelect(w)
	w.WriteString(") AS ")
	quote(w, s.alias)
}
func (s DerivedTable) tableQualifier() string { return s.alias }
func (s DerivedTable) INNER_JOIN(other TableExpr, on Expr[bool]) TableExpr {
	return joinedTable{left: s, joins: []join{{"INNER JOIN", other, on}}}
}
func (s DerivedTable) Column[T any](alias Alias[T]) Expr[T] {
	return Raw[T](fmt.Sprintf("\"%s\".\"%s\"", s.alias, alias.name))
}

func Raw[T any](sql string, args ...any) Expr[T] {
	return Expr[T]{expression{func(w *writer) {
		n := 0
		for {
			i := strings.IndexByte(sql, '?')
			if i < 0 {
				w.WriteString(sql)
				break
			}
			w.WriteString(sql[:i])
			if n >= len(args) {
				w.WriteByte('?')
			} else {
				w.arg(args[n])
				n++
			}
			sql = sql[i+1:]
		}
	}}}
}
func Bool(v bool) Expr[bool]           { return Value(v) }
func String(v string) Expr[string]     { return Value(v) }
func Int(v int64) Expr[int]            { return Value(int(v)) }
func Int64(v int64) Expr[int64]        { return Value(v) }
func UUID(v uuid.UUID) Expr[uuid.UUID] { return Value(v) }
func RawInt(sql string) Expr[int]      { return Raw[int](sql) }
func ILike[E TypedExpression[string]](e E, value string) Expr[bool] {
	return binary(e, " ILIKE ", Value(value))
}
func AND(e ...Expr[bool]) Expr[bool] { return booleans(e, " AND ") }
func OR(e ...Expr[bool]) Expr[bool]  { return booleans(e, " OR ") }
func NOT(e Expr[bool]) Expr[bool] {
	return Expr[bool]{expression{func(w *writer) { w.WriteString("NOT ("); e.writeSQL(w); w.WriteByte(')') }}}
}
func Exists(b *Builder) Expr[bool] {
	return Expr[bool]{expression{func(w *writer) { w.WriteString("EXISTS ("); _ = b.writeSelect(w); w.WriteByte(')') }}}
}
func booleans(es []Expr[bool], sep string) Expr[bool] {
	return Expr[bool]{expression{func(w *writer) { w.WriteByte('('); writeBools(w, es, sep); w.WriteByte(')') }}}
}
func CountAll() Expr[int64] { return Raw[int64]("COUNT(*)") }

var STAR = Raw[any]("*")

func COUNT(_ Expression) Expr[int64]          { return CountAll() }
func MIN[T any](e TypedExpression[T]) Expr[T] { return aggregate("MIN", e) }
func MAX[T any](e TypedExpression[T]) Expr[T] { return aggregate("MAX", e) }
func DISTINCT(e Expression) Expression {
	return expression{func(w *writer) { w.WriteString("DISTINCT "); e.writeSQL(w) }}
}
func aggregate[T any](name string, e TypedExpression[T]) Expr[T] {
	return Expr[T]{expression{func(w *writer) { w.WriteString(name); w.WriteByte('('); e.writeSQL(w); w.WriteByte(')') }}}
}
func Columns(es ...Expression) Expression     { return expression{func(w *writer) { writeExprs(w, es) }} }
func Count(b *Builder, alias string) *Builder { return Select(CountAll()).From(b.As(alias)) }
func writeExprs(w *writer, es []Expression) {
	for i, e := range es {
		if i > 0 {
			w.WriteString(", ")
		}
		e.writeSQL(w)
	}
}
func writeBools(w *writer, es []Expr[bool], sep string) {
	for i, e := range es {
		if i > 0 {
			w.WriteString(sep)
		}
		e.writeSQL(w)
	}
}
func quote(w *writer, s string) {
	w.WriteByte('"')
	w.WriteString(strings.ReplaceAll(s, "\"", "\"\""))
	w.WriteByte('"')
}
