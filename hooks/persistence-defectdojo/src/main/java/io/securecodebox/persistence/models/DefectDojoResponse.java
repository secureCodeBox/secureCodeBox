package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class DefectDojoResponse<T> {
    @JsonProperty
    int count;

    @JsonProperty
    String next;

    @JsonProperty
    String previous;

    @JsonProperty
    List<T> results;

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public String getNext() {
        return next;
    }

    public void setNext(String next) {
        this.next = next;
    }

    public String getPrevious() {
        return previous;
    }

    public void setPrevious(String previous) {
        this.previous = previous;
    }

    public List<T> getResults() {
        return results;
    }

    public void setResults(List<T> results) {
        this.results = results;
    }


}
