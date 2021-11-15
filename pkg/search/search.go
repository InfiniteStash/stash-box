package search

import (
	"github.com/olivere/elastic/v7"
	"github.com/stashapp/stash-box/pkg/manager/config"
)

var (
	client *elastic.Client
)

func Init() {
	client, _ = elastic.NewClient(elastic.SetURL(config.GetElasticsearchURL()))
}
