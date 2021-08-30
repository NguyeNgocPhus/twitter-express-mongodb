// goi api lấy ra tất cả các post

$(document).ready(() => {
  $.get('/api/posts', async (results) => {
    await outputPosts(results, $('.postsContainer'));
  });
});
