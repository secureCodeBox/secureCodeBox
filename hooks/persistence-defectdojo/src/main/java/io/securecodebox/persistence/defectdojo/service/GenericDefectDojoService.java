package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.defectdojo.models.DefectDojoModel;
import io.securecodebox.persistence.defectdojo.models.DefectDojoResponse;
import io.securecodebox.persistence.exceptions.DefectDojoLoopException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;

@Component
abstract public class GenericDefectDojoService<T extends DefectDojoModel> {
  private static final Logger LOG = LoggerFactory.getLogger(GenericDefectDojoService.class);

  @Value("${securecodebox.persistence.defectdojo.url}")
  protected String defectDojoUrl;

  @Value("${securecodebox.persistence.defectdojo.auth.key}")
  protected String defectDojoApiKey;

  @Autowired
  protected ObjectMapper objectMapper;

  @Autowired
  protected ObjectMapper searchStringMapper;

  protected long DEFECT_DOJO_OBJET_LIMIT = 100L;

  /**
   * @return The DefectDojo Authentication Header
   */
  private HttpHeaders getDefectDojoAuthorizationHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Token " + defectDojoApiKey);
    return headers;
  }

  protected abstract String getUrlPath();

  protected abstract Class<T> getModelClass();

  protected abstract DefectDojoResponse<T> deserializeList(String response) throws JsonProcessingException;

  public T get(long id) {
    RestTemplate restTemplate = new RestTemplate();
    HttpEntity<String> payload = new HttpEntity<>(getDefectDojoAuthorizationHeaders());

    LOG.info("Sending Request to DefectDojo: '{}'", defectDojoUrl + "/api/v2/" + this.getUrlPath() + "/" + id);

    ResponseEntity<T> response = restTemplate.exchange(
      defectDojoUrl + "/api/v2/" + this.getUrlPath() + "/" + id,
      HttpMethod.GET,
      payload,
      getModelClass()
    );

    return response.getBody();
  }

  protected DefectDojoResponse<T> internalSearch(Map<String, Object> queryParams, long limit, long offset) throws JsonProcessingException, URISyntaxException {
    RestTemplate restTemplate = new RestTemplate();
    HttpEntity<String> payload = new HttpEntity<>(getDefectDojoAuthorizationHeaders());

    var mutableQueryParams = new HashMap<String, Object>(queryParams);

    mutableQueryParams.put("limit", String.valueOf(limit));
    mutableQueryParams.put("offset", String.valueOf(offset));

    var multiValueMap = new LinkedMultiValueMap<String, String>();
    for (var entry : mutableQueryParams.entrySet()) {
      multiValueMap.set(entry.getKey(), String.valueOf(entry.getValue()));
    }

    var url = new URI(defectDojoUrl + "/api/v2/" + this.getUrlPath() + "/");
    var uriBuilder = UriComponentsBuilder.fromUri(url).queryParams(multiValueMap);

    LOG.debug("Sending search request as: '{}'", uriBuilder.build(multiValueMap).toString());

    ResponseEntity<String> responseString = restTemplate.exchange(
      uriBuilder.build(mutableQueryParams),
      HttpMethod.GET,
      payload,
      String.class
    );

    return deserializeList(responseString.getBody());
  }

  public List<T> search(Map<String, Object> queryParams) throws URISyntaxException, JsonProcessingException {
    List<T> objects = new LinkedList<>();

    boolean hasNext = false;
    long page = 0;
    do {
      LOG.debug("Getting up to {} results from Page {}", DEFECT_DOJO_OBJET_LIMIT, page);
      var response = internalSearch(queryParams, DEFECT_DOJO_OBJET_LIMIT, DEFECT_DOJO_OBJET_LIMIT * page++);
      objects.addAll(response.getResults());
      if (response.getNext() != null) {
        hasNext = true;
      }
      if (page > 100) {
        throw new DefectDojoLoopException("Looked for DefectDojo Object but could not find it after " + page + " paginated API pages of " + DEFECT_DOJO_OBJET_LIMIT + " each.");
      }
    } while (hasNext);

    return objects;
  }

  public List<T> search() throws URISyntaxException, JsonProcessingException {
    return search(new LinkedHashMap<>());
  }

  @SuppressWarnings("unchecked")
  public Optional<T> searchUnique(T searchObject) throws URISyntaxException, JsonProcessingException {
    searchStringMapper.setSerializationInclusion(JsonInclude.Include.NON_DEFAULT);
    Map<String, Object> queryParams = searchStringMapper.convertValue(searchObject, Map.class);

    LOG.info("SearchMap: {}", queryParams);

    var objects = search(queryParams);

    return objects.stream()
      .filter((object) -> object != null && object.equalsQueryString(queryParams))
      .findFirst();
  }

  public Optional<T> searchUnique(Map<String, Object> queryParams) throws URISyntaxException, JsonProcessingException {
    var objects = search(queryParams);

    return objects.stream()
      .filter((object) -> object.equalsQueryString(queryParams))
      .findFirst();
  }

  public T create(T object) {
    RestTemplate restTemplate = new RestTemplate();
    HttpEntity<T> payload = new HttpEntity<T>(object, getDefectDojoAuthorizationHeaders());

    ResponseEntity<T> response = restTemplate.exchange(defectDojoUrl + "/api/v2/" + getUrlPath() + "/", HttpMethod.POST, payload, getModelClass());
    return response.getBody();
  }

  public void delete(long id) {
    RestTemplate restTemplate = new RestTemplate();
    HttpEntity<String> payload = new HttpEntity<>(getDefectDojoAuthorizationHeaders());

    LOG.debug("Sending: DELETE {}", defectDojoUrl + "/api/v2/" + getUrlPath() + "/" + id + "/");

    restTemplate.exchange(defectDojoUrl + "/api/v2/" + getUrlPath() + "/" + id + "/", HttpMethod.DELETE, payload, String.class);
  }
}
