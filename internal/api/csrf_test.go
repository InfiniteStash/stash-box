package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

// reached reports whether the middleware passed the request to the next handler.
func reached(t *testing.T, req *http.Request) bool {
	t.Helper()

	var called bool
	h := crossOriginProtection()(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	h.ServeHTTP(httptest.NewRecorder(), req)
	return called
}

func crossSitePost(t *testing.T, contentType string) *http.Request {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, "https://stashdb.example/graphql", nil)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	return req
}

// The multipart transport accepts a CORS-simple content type, so a cross-origin
// form post reaches the GraphQL executor on the session cookie without this.
func TestCrossOriginMultipartPostIsRejected(t *testing.T) {
	assert.False(t, reached(t, crossSitePost(t, "multipart/form-data; boundary=x")))
}

func TestCrossOriginJSONPostIsRejected(t *testing.T) {
	assert.False(t, reached(t, crossSitePost(t, "application/json")))
}

func TestAPIKeyRequestBypassesProtection(t *testing.T) {
	req := crossSitePost(t, "multipart/form-data; boundary=x")
	req.Header.Set(APIKeyHeader, "some-key")

	assert.True(t, reached(t, req), "API keys carry no ambient credential")
}

func TestSameOriginPostIsAllowed(t *testing.T) {
	req := crossSitePost(t, "application/json")
	req.Header.Set("Sec-Fetch-Site", "same-origin")

	assert.True(t, reached(t, req))
}

// Non-browser clients send neither header and must keep working.
func TestRequestWithoutBrowserHeadersIsAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "https://stashdb.example/graphql", nil)
	req.Header.Set("Content-Type", "application/json")

	assert.True(t, reached(t, req))
}

func TestSafeMethodIsAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://stashdb.example/graphql", nil)
	req.Header.Set("Sec-Fetch-Site", "cross-site")

	assert.True(t, reached(t, req))
}
