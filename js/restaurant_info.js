let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantAndReviewsFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant and reviews from page URL.
 */
fetchRestaurantAndReviewsFromURL = (callback) => {
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
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
    DBHelper.fetchReviewsByRestaurantId(id)
      .then(result => result.json())
      .then(fillReviewsHTML);
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = `/img/${restaurant.id}-800x600.jpg`;
  image.srcset = `
    /img/${restaurant.id}-200x150.jpg 200w,
    /img/${restaurant.id}-400x300.jpg 400w,
    /img/${restaurant.id}-800x600.jpg 800w
  `;
  image.sizes = `
    (max-width: 600px) 560px,
    570px
  `;
  image.alt = `The ${restaurant.name} restaurant`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const favoriteButton = document.createElement('button');
  const isFavorite = restaurant.is_favorite.toString() === "true" // Need to typecast due to bug in backend

  favoriteButton.className = isFavorite
    ? 'favorite-button favorite-button-on'
    : 'favorite-button favorite-button-off';

  favoriteButton.innerHTML = '⭐';

  favoriteButton.setAttribute(
    'aria-label',
    isFavorite
      ? `Remove ${restaurant.name} from favorites`
      : `Add ${restaurant.name} to favorites`
  );

  favoriteButton.onclick = () => {
    const response = DBHelper.favoriteRestaurantById(restaurant.id, !isFavorite);

    response.then(
      result => {
        if (result.ok) {
          favoriteButton.classList.toggle("favorite-button-on");
          favoriteButton.classList.toggle("favorite-button-off");
        }
      }
    ).catch(error => {
        favoriteButton.classList.toggle("favorite-button-on");
        favoriteButton.classList.toggle("favorite-button-off");
    });
  };

  document.getElementById('restaurant-info').append(favoriteButton);

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

  const row = document.createElement('tr');

  const day = document.createElement('th');
  day.innerHTML = "Day";
  row.appendChild(day);

  const time = document.createElement('th');
  time.innerHTML = "Operating hours";
  row.appendChild(time);

  hours.appendChild(row);

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

submitWriteReviewForm = event => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = {};

  for (const entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }

  DBHelper.createReviewForRestaurantWithId(self.restaurant.id, data)
    .then(response => response.json())
    .then(addReviewHTML)
    .then(clearAddReviewForm)
    .catch(error => {
      addReviewHTML({
        // Network is down...
        // Add review anyway, with some dummy data, and replay request when online
        ...data,
        restaurant_id: self.restaurant.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      clearAddReviewForm();
    });
};

addReviewHTML = review => {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
};

clearAddReviewForm = () => {
  const writeReviewForm = document.getElementById("write-review-form");
  writeReviewForm.reset();
};

/**
 * Create all reviews HTML and add them to the webpage.
 * Hookup submit review event handler.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const writeReviewForm = document.getElementById("write-review-form");
  writeReviewForm.onsubmit = submitWriteReviewForm;

  const container = document.getElementById('reviews-container');

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
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const div = document.createElement('div');
  li.appendChild(div);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  div.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleString();
  div.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  div.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  div.appendChild(comments);

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
