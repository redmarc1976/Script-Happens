variable "subscription_id" {
  type        = string
  description = "subscription id we are deploying into"
}

variable "resource_group_name" {
  type        = string
  description = "name of existing resource group to deploy into"
}

variable "location" {
  type        = string
  description = "The azure region we are deploying to"
  default     = "westeurope"
}

variable "project_name" {
  type        = string
  description = "The name of overlaying project for the infrastructure deployment"
  default     = "project"
}

variable "sql_admin_username" {
  type        = string
  description = "The admin username for our SQL DB"
}

variable "sql_location" {
  type        = string
  description = "The azure region to deploy SQL resources into"
  default     = "eastus2"
}

variable "resource_suffix" {
  type        = string
  description = "A random suffix to support resource name uniqueness"

}
