let restaurants, neighborhoods, cuisines;
var map;
var markers = [];
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	fetchNeighborhoods();
	fetchCuisines();
	registerServiceWorker();
	DBHelper.fetchRestaurants((err, restaurants) => {
		DBHelper.createIndexedDB(restaurants, 'restaurants');
	});
	updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) {
			// Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach((neighborhood) => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach((cuisine) => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
};

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
	addMarkersToMap();
};

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
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	});
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach((m) => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach((restaurant) => {
		ul.append(createRestaurantHTML(restaurant));
	});
	createGridSystem(ul);
};
/**
 * Create row element
 */
createRowElement = () => {
	const row = document.createElement('div');
	row.className = 'row';

	return row;
};
/**
 * Organize restaurants HTML to a grid
 */
createGridSystem = (ul) => {
	const restaurants = ul.childNodes;
	const restaurantsClone = Array.from(restaurants);
	for (var i = 0; i < restaurantsClone.length; i += 4) {
		const wrapper = createRowElement();
		wrapper.append(...restaurantsClone.slice(i, i + 4));
		ul.append(wrapper);
	}
};
/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
	const li = document.createElement('div');
	li.className = 'restaurant col-3 col-s-6 col-xs-12';
	const image = document.createElement('img');
	image.className = 'restaurant-img lazy';
	image.setAttribute('alt', `${restaurant.name} Restaurant`);
	image.setAttribute('data-echo',`./../img/${restaurant.photograph}.jpg`);
	image.src = './../img/icon.png';
	li.append(image);

	const name = document.createElement('h1');
	name.innerHTML = restaurant.name;
	name.setAttribute('tabindex', '0');
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	const more = document.createElement('a');
	more.setAttribute('aria-label', `${restaurant.name} Restaurant Details Page`);
	more.innerHTML = 'View Details';
	more.href = DBHelper.urlForRestaurant(restaurant);
	li.append(more);

	return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach((restaurant) => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url;
		});
		self.markers.push(marker);
	});
};
/**
 * Register serice worker
 */
registerServiceWorker = () => {
	if (!navigator.serviceWorker) return;
	console.log('== service worker js ==');
	if ('serviceWorker' in navigator) {
		const sw = navigator.serviceWorker;
		window.addEventListener('load', function() {
			sw.register('./../sw.js').then(
				function(registration) {
					console.log('== registration ==', registration);
					// Registration was successful
					// registration.sync.register('backgroundSync');
					console.log('ServiceWorker registration successful with scope: ', registration.scope);
				},
				function(err) {
					// registration failed :(
					console.log('ServiceWorker registration failed: ', err);
				}
			);
		});
	}
};

getDataFromIndexedDB = (store) => {
	console.log('== store ==', store);
	const getRestaurantsRequest = store.get('Mission Chinese Food');
	getRestaurantsRequest.onsuccess = event => {
		console.log('== success ==', event);
		console.log('== success ==', getRestaurantsRequest.result);
	}
}

toggleMap = () => {
	const map = document.getElementById('map');
	if (map.style.display === 'none') {
		map.style.display = 'block'
		window.initMap();
	} else {
		map.style.display = 'none'
	}
}
