.[] | select((.comments.nodes // []) | length > 0) | {
  discussion_thread_id: .id,
  is_resolved: .isResolved,
  is_outdated: .isOutdated,
  comments: [ (.comments.nodes // [])[] | {
    comment_id: .databaseId,
    review_comment: ((.body // "") | gsub("<!--[\\s\\S]*?-->"; "") | gsub("^\\s+|\\s+$"; "")),
    author_username: (if (.author.login // "") | test("coderabbit"; "i") then "CodeRabbit" else .author.login end),
    path: .path,
    line: .line,
    original_line: .originalLine,
    commit_oid: (.commit.oid // "")
  } ]
}
