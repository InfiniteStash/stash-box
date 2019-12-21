import React, { useState } from 'react';
import { useQuery } from '@apollo/react-hooks';
import Select from 'react-select';

import TagsQuery from 'src/queries/Tags.gql';
import { Tags, TagsVariables, Tags_queryTags_tags as Tag } from 'src/definitions/Tags';
import { SortDirectionEnum } from 'src/definitions/globalTypes';

interface TagSelectProps {
    tags:string[];
    onChange:(tags:string[]) => void;
}

const TagSelect: React.FC<TagSelectProps> = ({ tags: initialTags, onChange }) => {
    const [tags, setTags] = useState(initialTags);
    const { loading, data } = useQuery<Tags, TagsVariables>(TagsQuery, {
        variables: {
            filter: { per_page: 1000, sort: 'NAME', direction: SortDirectionEnum.ASC },
        }
    });

    if (loading)
        return <div></div>;

    const options = data.queryTags.tags.map(tag => (
        { label: tag.description, value: tag.name }
    ));

    const selectedValues = tags.map(tag => (
        { label: tag, value: tag }
    ));

    const addTag = (selected:{label:string, value:string}) => {
        const newTags = [...tags, selected.value];
        setTags(newTags)
        onChange(newTags);
    };

    return (
        <Select
            isMulti
            options={options}
            value={selectedValues}
            closeMenuOnSelect={false}
            onChange={addTag}
        />
    );
};

export default TagSelect;
