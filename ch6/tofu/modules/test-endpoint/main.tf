resource "time_sleep" "wait" {
  create_duration = "30s"
}

data "http" "test_endpoint" {
  url    = var.endpoint
  method = "GET"

  depends_on = [time_sleep.wait]
}