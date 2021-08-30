//  gọi api lấy ra post vs "id"

$(document).ready(() => {
  $.get('/api/posts/' + postId, (results) => {
    outputPostsWithReplies(results, $('.postsContainer'));
  });
});
