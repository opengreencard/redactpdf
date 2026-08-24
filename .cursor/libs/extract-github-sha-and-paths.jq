.[] |
  (.comments.nodes // [])[] |
  select(.path != null and (.commit.oid // "") != "") |
  "\(.commit.oid):\(.path)"
