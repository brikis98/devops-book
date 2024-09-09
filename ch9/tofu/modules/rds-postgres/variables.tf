# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  description = "The name of the DB instance, the (logical) database to create within the instance, and all other resources"
  type        = string
}

variable "instance_class" {
  description = "The type of DB instance to deploy. See https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.Types.html for supported options."
  type        = string
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# ---------------------------------------------------------------------------------------------------------------------

variable "username" {
  description = "Username for master DB user. Required unless replicate_source_db or snapshot_identifier is set."
  type        = string
  default     = null
}

variable "password" {
  description = "Password for master DB user. Required unless replicate_source_db or snapshot_identifier is set."
  type        = string
  default     = null
  sensitive   = true
}

variable "postgres_version" {
  description = "The version of PostgreSQL to run. See https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts.General.DBVersions for supported values."
  type        = string
  default     = "16.3"
}

variable "allocated_storage" {
  description = "The amount of storage to allocate, in GB"
  type        = number
  default     = 20
}

variable "apply_immediately" {
  description = "If set to true, apply DB modifications immediately. Otherwise, apply them in the next maintenance window."
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "The number of days to retain backsup. Must be between 0 and 35."
  type        = number
  default     = 0
}

variable "backup_window" {
  description = "The daily time range (in UTC) during which automated backups are created if they are enabled. Example: 09:46-10:16. Only used if backup_retention_period > 0."
  type        = string
  default     = null
}

variable "replicate_source_db" {
  description = "If specified, this database will be a read replica of the database with the given ID."
  type        = string
  default     = null
}

variable "snapshot_identifier" {
  description = "If specified, restore this database from a snapshot. This correlates to the snapshot ID you'd find in the RDS console, e.g: rds:production-2015-06-26-06-05."
  type        = string
  default     = null
}