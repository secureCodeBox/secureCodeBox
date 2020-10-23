package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ToolConfig {
    @JsonProperty
    long id;

    @JsonProperty
    String url;

    @JsonProperty
    String name;

    @JsonProperty("tool_type")
    String toolType;

    @JsonProperty("configuration_url")
    String configUrl;

    @JsonProperty
    String description;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getConfigUrl() {
        return configUrl;
    }

    public void setConfigUrl(String configUrl) {
        this.configUrl = configUrl;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getToolType() {
        return toolType;
    }

    public void setToolType(String toolType) {
        this.toolType = toolType;
    }
}
