package io.securecodebox.persistence.defectdojo.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Engagement extends DefectDojoModel {
  @JsonProperty("branch_tag")
  public String branch;

  @JsonProperty
  protected Long id;

  @JsonProperty
  protected String name;

  @JsonProperty
  protected Long product;

  @JsonProperty("target_start")
  protected String targetStart;

  @JsonProperty("target_end")
  protected String targetEnd;

  @JsonProperty
  protected Long lead;

  @JsonProperty("engagement_type")
  @Builder.Default
  protected String engagementType = "CI/CD";

  @JsonProperty
  @Builder.Default
  protected Status status = Status.IN_PROGRESS;

  @JsonProperty
  protected List<String> tags;

  @JsonProperty
  protected String tracker;

  @JsonProperty("build_id")
  protected String buildID;

  @JsonProperty("commit_hash")
  protected String commitHash;

  @JsonProperty("source_code_management_uri")
  protected String repo;

  @JsonProperty("build_server")
  protected Long buildServer;

  @JsonProperty("source_code_management_server")
  protected Long scmServer;

  @JsonProperty("orchestration_engine")
  protected Long orchestrationEngine;

  @JsonProperty
  protected String description;

  @JsonProperty("deduplication_on_engagement")
  protected boolean deduplicationOnEngagement;

  @JsonProperty("threat_model")
  @Builder.Default
  protected Boolean threatModel = false;

  @JsonProperty("api_test")
  @Builder.Default
  protected Boolean apiTest = false;

  @JsonProperty("pen_test")
  @Builder.Default
  protected Boolean penTest = false;

  @JsonProperty("check_list")
  @Builder.Default
  protected Boolean checkList = false;

  @JsonProperty
  protected String version;

  @Override
  public boolean equalsQueryString(Map<String, Object> queryParams) {
    if (queryParams == null) {
      return false;
    }
    if (queryParams.containsKey("id") && queryParams.get("id") != null && queryParams.get("id").equals(this.id)) {
      return true;
    }
    if (queryParams.containsKey("name") && queryParams.get("name") != null && queryParams.get("name").equals(this.name)) {
      return true;
    }

    return false;
  }

  /**
   * Currently only contains the statuses relevant to us.
   * If you need others, feel free to add them ;)
   */
  public enum Status {
    @JsonProperty("Completed")
    COMPLETED,
    @JsonProperty("In Progress")
    IN_PROGRESS
  }
}
