package cache

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/pkg/logger"
)

// CacheManager handles caching of resized images
type cacheManager struct {
	path string
}

var (
	instance *cacheManager
	once     sync.Once
)

func GetCacheManager() *cacheManager {
	once.Do(func() {
		resizeConfig := config.GetImageResizeConfig()
		if resizeConfig == nil || !resizeConfig.Enabled || len(resizeConfig.CachePath) == 0 {
			logger.Debugf("image cache not enabled")
			return
		}

		if err := os.MkdirAll(resizeConfig.CachePath, 0755); err != nil {
			logger.Errorf("Failed to initialize cache directory: %v", err)
			return
		}

		logger.Debugf("image cache enabled in: %s", resizeConfig.CachePath)

		instance = &cacheManager{}
		instance.path = resizeConfig.CachePath
	})
	return instance
}

// Sharded like the image storage backend, so no single directory holds every entry.
func (c *cacheManager) getItemDir(id uuid.UUID) string {
	key := id.String()
	return filepath.Join(c.path, key[0:2], key[2:4])
}

func (c *cacheManager) getItemPath(id uuid.UUID, size int) string {
	filename := fmt.Sprintf("%s_%d", id.String(), size)
	return filepath.Join(c.getItemDir(id), filename)
}

func (c *cacheManager) Read(id uuid.UUID, size int) (io.ReadCloser, error) {
	filePath := c.getItemPath(id, size)
	return os.Open(filePath)
}

func (c *cacheManager) Write(id uuid.UUID, size int, data []byte) error {
	dir := c.getItemDir(id)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Rename into place so a concurrent reader never sees a partial file.
	tmp, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	if err := os.Chmod(tmp.Name(), 0644); err != nil {
		return err
	}

	return os.Rename(tmp.Name(), c.getItemPath(id, size))
}

func (c *cacheManager) Delete(id uuid.UUID) error {
	globPath := filepath.Join(c.getItemDir(id), fmt.Sprintf("%s_*", id.String()))
	files, err := filepath.Glob(globPath)
	if err != nil {
		return err
	}

	for _, f := range files {
		if err := os.Remove(f); err != nil {
			return err
		}
		logger.Debugf("deleted cached image: %s", f)
	}

	return nil
}
