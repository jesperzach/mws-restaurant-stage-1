let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const button = document.createElement('button');
  button.onclick = () => location.assign(DBHelper.urlForRestaurant(restaurant));
  button.setAttribute("aria-label", `View ${restaurant.name} details`);
  li.append(button);

  const imageContainer = document.createElement('div');
  imageContainer.className = 'restaurant-img-container';
  li.append(imageContainer);

  const image = document.createElement('img');
  image.src = `/img/${restaurant.id}-800x600.jpg`;
  image.srcset = `
    /img/${restaurant.id}-200x150.jpg 200w,
    /img/${restaurant.id}-400x300.jpg 400w,
    /img/${restaurant.id}-800x600.jpg 800w
  `;
  image.sizes = `
    (max-width: 600px) 60px,
    (max-width: 930px) 420px,
    370px
  `;
  image.alt = `The ${restaurant.name} restaurant`;
  imageContainer.append(image);

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

  imageContainer.append(favoriteButton);

  const infoContainer = document.createElement('div');
  infoContainer.className = 'restaurant-info-container';
  li.append(infoContainer);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  infoContainer.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  infoContainer.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  infoContainer.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details ›';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute("aria-label", `View ${restaurant.name} details`);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
