$('#searchBox').keydown((event) => {
  clearTimeout(timer);
  var textbox = $(event.target);
  var value = textbox.val();
  var searchType = textbox.data().search;
  // sau 1 s sẽ gửi request 
  timer = setTimeout(() => {
    value = textbox.val().trim();

    if (value == '') {
      $('.resultsContainer').html('');
    } else {
      search(value, searchType);
    }
  }, 1000);
});

function search(searchTerm, searchType) {
  var url = searchType == 'users' ? '/api/users' : '/api/posts';

  $.get(url, { search: searchTerm }, (results) => {
    console.log(results);
    if (searchType == 'users') {
      outputUsers(results, $('.resultsContainer'));
    } else {
      outputPosts(results, $('.resultsContainer'));
    }
  });
}
