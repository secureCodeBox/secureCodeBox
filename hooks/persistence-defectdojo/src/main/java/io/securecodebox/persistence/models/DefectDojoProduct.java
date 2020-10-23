package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import lombok.Data;

@Data
public class DefectDojoProduct {
    @JsonProperty
    long id;

    @JsonProperty
    String name;

    @JsonProperty
    String description;

    @JsonProperty("findings_count")
    int findingsCount;

    @JsonProperty("authorized_users")
    List<String> authorizedUsers;

    public DefectDojoProduct() {}

    public DefectDojoProduct(String productName, String productDescription) {
        name = productName;
        description = productDescription;
    }
}
