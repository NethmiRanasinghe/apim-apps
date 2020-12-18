package org.wso2.carbon.apimgt.rest.api.publisher.v1.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import javax.validation.constraints.*;


import io.swagger.annotations.*;
import java.util.Objects;

import javax.xml.bind.annotation.*;
import org.wso2.carbon.apimgt.rest.api.common.annotations.Scope;
import com.fasterxml.jackson.annotation.JsonCreator;

import javax.validation.Valid;



public class APIRevisionDeploymentDTO   {
  
    private String revisionUuid = null;
    private String deployment = null;
    private String type = null;
    private Boolean displayOnDevportal = null;
    private java.util.Date deployedTime = null;

  /**
   **/
  public APIRevisionDeploymentDTO revisionUuid(String revisionUuid) {
    this.revisionUuid = revisionUuid;
    return this;
  }

  
  @ApiModelProperty(example = "c26b2b9b-4632-4ca4-b6f3-521c8863990c", value = "")
  @JsonProperty("revisionUuid")
  public String getRevisionUuid() {
    return revisionUuid;
  }
  public void setRevisionUuid(String revisionUuid) {
    this.revisionUuid = revisionUuid;
  }

  /**
   **/
  public APIRevisionDeploymentDTO deployment(String deployment) {
    this.deployment = deployment;
    return this;
  }

  
  @ApiModelProperty(example = "production and sandbox", value = "")
  @JsonProperty("deployment")
  public String getDeployment() {
    return deployment;
  }
  public void setDeployment(String deployment) {
    this.deployment = deployment;
  }

  /**
   **/
  public APIRevisionDeploymentDTO type(String type) {
    this.type = type;
    return this;
  }

  
  @ApiModelProperty(example = "gateway or microgateway", value = "")
  @JsonProperty("type")
  public String getType() {
    return type;
  }
  public void setType(String type) {
    this.type = type;
  }

  /**
   **/
  public APIRevisionDeploymentDTO displayOnDevportal(Boolean displayOnDevportal) {
    this.displayOnDevportal = displayOnDevportal;
    return this;
  }

  
  @ApiModelProperty(example = "true", value = "")
  @JsonProperty("displayOnDevportal")
  public Boolean isDisplayOnDevportal() {
    return displayOnDevportal;
  }
  public void setDisplayOnDevportal(Boolean displayOnDevportal) {
    this.displayOnDevportal = displayOnDevportal;
  }

  /**
   **/
  public APIRevisionDeploymentDTO deployedTime(java.util.Date deployedTime) {
    this.deployedTime = deployedTime;
    return this;
  }

  
  @ApiModelProperty(value = "")
  @JsonProperty("deployedTime")
  public java.util.Date getDeployedTime() {
    return deployedTime;
  }
  public void setDeployedTime(java.util.Date deployedTime) {
    this.deployedTime = deployedTime;
  }


  @Override
  public boolean equals(java.lang.Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    APIRevisionDeploymentDTO apIRevisionDeployment = (APIRevisionDeploymentDTO) o;
    return Objects.equals(revisionUuid, apIRevisionDeployment.revisionUuid) &&
        Objects.equals(deployment, apIRevisionDeployment.deployment) &&
        Objects.equals(type, apIRevisionDeployment.type) &&
        Objects.equals(displayOnDevportal, apIRevisionDeployment.displayOnDevportal) &&
        Objects.equals(deployedTime, apIRevisionDeployment.deployedTime);
  }

  @Override
  public int hashCode() {
    return Objects.hash(revisionUuid, deployment, type, displayOnDevportal, deployedTime);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class APIRevisionDeploymentDTO {\n");
    
    sb.append("    revisionUuid: ").append(toIndentedString(revisionUuid)).append("\n");
    sb.append("    deployment: ").append(toIndentedString(deployment)).append("\n");
    sb.append("    type: ").append(toIndentedString(type)).append("\n");
    sb.append("    displayOnDevportal: ").append(toIndentedString(displayOnDevportal)).append("\n");
    sb.append("    deployedTime: ").append(toIndentedString(deployedTime)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(java.lang.Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}

