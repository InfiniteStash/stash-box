package models

func (e TagEditDetailsInput) TagEditFromDiff(orig Tag) (*TagEdit, *TagEdit) {
    newTag := &TagEdit{}
    originalTag := &TagEdit{}

	if e.Name != nil && *e.Name != orig.Name {
		newName := *e.Name
		newTag.Name = &newName
        originalTag.Name = &orig.Name
	}

	if e.Description != nil && (!orig.Description.Valid || *e.Description != orig.Description.String) {
		newDesc := *e.Description
		newTag.Description = &newDesc
        if orig.Description.Valid {
            originalTag.Description = &orig.Description.String
        }
	}

	return newTag, originalTag
}
