resource "aws_db_instance" "postgres" {
  identifier = var.name
  db_name    = var.replicate_source_db == null && var.snapshot_identifier == null ? var.name : null

  engine         = var.replicate_source_db == null && var.snapshot_identifier == null ? "postgres" : null
  engine_version = var.replicate_source_db == null && var.snapshot_identifier == null ? var.postgres_version : null

  instance_class    = var.instance_class
  allocated_storage = var.replicate_source_db == null && var.snapshot_identifier == null ? var.allocated_storage : null

  username = var.username
  password = var.password

  apply_immediately         = var.apply_immediately
  skip_final_snapshot       = var.backup_retention_period == 0
  final_snapshot_identifier = "${var.name}-final-snapshot-${random_pet.final_snapshot_id.id}"
  snapshot_identifier       = var.snapshot_identifier
  backup_retention_period   = var.backup_retention_period
  backup_window             = var.backup_window

  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = true

  replicate_source_db = var.replicate_source_db
}

resource "aws_security_group" "db" {
  name = var.name
}

resource "aws_security_group_rule" "allow_all_inbound" {
  type              = "ingress"
  from_port         = aws_db_instance.postgres.port
  to_port           = aws_db_instance.postgres.port
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.db.id
}

resource "random_pet" "final_snapshot_id" {}