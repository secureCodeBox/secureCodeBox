package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ToolType {
    @JsonProperty
    String id;

    @JsonProperty
    String name;

    @JsonProperty
    String description;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
