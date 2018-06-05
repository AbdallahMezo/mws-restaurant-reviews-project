let restaurant;
var map;
/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      fetchRestaurantReviews(restaurant);
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      DBHelper.fetchReviews((err, reviews) => {
        DBHelper.createIndexedDB(reviews, 'reviews');
      });
    }
  });
}
/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        self.restaurant = DBHelper.getFromIndexedDB(DBHelper.getObjectStore('restaurants'), id);
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const favoriteIconSpan = document.getElementById('isFavorite');
  favoriteIconSpan.innerHTML = restaurant.is_favorite === 'true' ? '💘' : '💙';
  favoriteIconSpan.className = 'isFavorite';
  console.log('== restaurant ==', restaurant);
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img lazy'
  image.src = `../img/${restaurant.photograph}.jpg`;
  image.setAttribute('alt', `${restaurant.name} Restaurant`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const userReviewWrapper = document.createElement('div');
  userReviewWrapper.className = 'user-review_wrapper';

  const name = document.createElement('p');
  name.innerHTML = review.name;
  userReviewWrapper.appendChild(name);

  const date = document.createElement('p');
  const dateInDays = new Date(review.createdAt).toDateString();
  date.innerHTML = dateInDays.toString('yyyy-MM-dd');
  userReviewWrapper.appendChild(date);
  li.appendChild(userReviewWrapper);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Handle send button click
 */
sendReview = () => {
  const data = getFormData(restaurant = self.restaurant);
  const url = 'http://localhost:1337/reviews/'
  fetch(url, {
    body: JSON.stringify(data),
    method: 'POST',
  }).then(result => {
    console.log('result ', result)
  }).catch(error => {
    console.error('error in sending review ==> ', error);
    console.log('stored to be send later <3');
  })
  const form = document.getElementById('review_form');
  form.reset();
  fetchRestaurantReviews(restaurant = self.restaurant)
}

/**
 * Fetch Restaurants reviews
 */
fetchRestaurantReviews = (restaurant = self.restaurant) => {
  DBHelper.fetchReviews((err, reviews) => {
    console.log('== reviews ==', reviews);
    console.log('== reviews ==', reviews);
    const restaurantReviews = reviews.filter(obj => obj.restaurant_id === restaurant.id)
    console.log('== restaurantReviews ==', restaurantReviews);
    fillReviewsHTML(restaurantReviews)
  })
}
/**
 * Get form data
 */
getFormData = (restaurant = self.restaurant) => {
  const data = {};
  const name = document.getElementById('reviewer-name').value
  data.name = name;

  const restaurantId = restaurant.id
  data.restaurant_id = restaurantId;

  const rating = document.getElementById('rating').value;
  data.rating = rating;
  const comment = document.getElementById('review-comment').value
  data.comments = comment;
  if(!name || !comment){
    return;
  }
  return data;
}
/**
 * Handle favourting restaurant
 */
favoriteRestaurant = () => {

  if(navigator.onLine){
    const favoriteButton = document.getElementById('isFavorite');
    let isFavorited = favoriteButton.innerHTML === '💘' ? true : false;
    console.log('-- isFavorited --', isFavorited);
    const id = self.restaurant.id;
    const url = `http://localhost:1337/restaurants/${id}/?is_favorite=${!isFavorited}`;
    isFavorited = !isFavorited;
    fetch(url, {
      method: 'PUT',
    }).then(result => {
      favoriteButton.innerHTML = isFavorited ? '💘' : '💙';
    }).catch(error => {
      console.error('error in sending review ==> ', error);
      console.log('stored to be send later <3');
    })
  } else {
    navigator.serviceWorker.register('../sw.js').then(reg => {
      reg.sync.register('backgroundSync');
      console.log('== ofline ==');
    })

  }

}
