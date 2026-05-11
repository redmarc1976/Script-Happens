resource "azurerm_resource_group" "this" {
  name     = "${var.project_name}-rg"
  location = var.location
}

resource "azurerm_static_web_app" "this" {
  name                = "${var.project_name}-swa"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
}

resource "azurerm_mssql_server" "this" {
  name                         = "${var.project_name}-${var.resource_suffix}-sql"
  resource_group_name          = azurerm_resource_group.this.name
  location                     = var.sql_location
  version                      = "12.0"
  administrator_login          = var.sql_admin_username
  administrator_login_password = random_password.sql_admin.result

}

resource "azurerm_mssql_database" "this" {
  name      = "${var.project_name}-db"
  server_id = azurerm_mssql_server.this.id
  sku_name  = "Basic"

}

resource "azurerm_storage_account" "this" {
  name                     = "${var.project_name}${var.resource_suffix}sa"
  resource_group_name      = azurerm_resource_group.this.name
  location                 = azurerm_resource_group.this.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "this" {
  name                  = "floorplans"
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "private"
}

# Hackathon only — open to all IPs for local dev convenience, restrict before any real use
resource "azurerm_mssql_firewall_rule" "dev" {
  name             = "hackathon-open"
  server_id        = azurerm_mssql_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}

resource "random_password" "sql_admin" {
  length  = 16
  special = true
  upper   = true
  lower   = true
  numeric = true
}
