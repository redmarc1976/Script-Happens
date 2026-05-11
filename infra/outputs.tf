
output "swa_default_host_name" {
  value       = azurerm_static_web_app.this.default_host_name
  description = "URL Azure assigned to the swa"
}

output "swa_id" {
  value       = azurerm_static_web_app.this.id
  description = "id of the created static web app"
}

output "swa_api_key" {
  value       = azurerm_static_web_app.this.api_key
  sensitive   = true
  description = "API key of the swa"
}

output "sql_admin_password" {
  value       = random_password.sql_admin.result
  sensitive   = true
  description = "The admin password for our created SQL server"

}

output "storage_account_name" {
  value       = azurerm_storage_account.this.name
  description = "name of the storage account for floorplans"
}

output "sql_server_fqdn" {
  value       = azurerm_mssql_server.this.fully_qualified_domain_name
  description = "The fully qualified domain name of the sql server"
}

output "sql_admin_username" {
  value       = var.sql_admin_username
  description = "Admin username of the SQL admin account"

}

