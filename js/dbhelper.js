/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `https://mws-restaurants-stage-3.herokuapp.com/restaurants`;
  }
  // static setObjectStore(objectStore){
  //   console.log('== DBHelper.objectStore ==', DBHelper.objectStore);
  //   console.log('== this.objectStore ==', this.objectStore);
  //   console.log('== objectStore ==', objectStore);
  //   dbObjectStore[objectStore.name] = objectStore.data;
  //   console.log('== dbObjectStore ==', dbObjectStore);
  //   DBHelper.objectStore = dbObjectStore;
  // }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const url = DBHelper.DATABASE_URL;
    fetch(url).then((response) => {
      return response.json()
    }).then(restaurants => {
		  DBHelper.createIndexedDB(restaurants, 'restaurants');
      callback(null, restaurants);
    }).catch(error => {
      // TODO: Get the indexed db from navigator or window and fetch the data for the user
      this.openDBGetRequest('restaurants', callback);
    })
  }
  /**
   * Fetch reviews
   */
  static fetchReviews(callback){
    const url = `https://mws-restaurants-stage-3.herokuapp.com/reviews/`
    fetch(url).then((response) => {
      return response.json()
    }).then(reviews => {
      callback(null, reviews);
    }).catch(error => {
      // TODO: Get the indexed db from navigator or window and fetch the data for the user
      this.openDBGetRequest('reviews', callback);
    })
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    if(!restaurant || !map){
      return;
    }
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static createIndexedDB(objects, name) {
    return this.openDBRequest(objects, name);
  };

  static openDBRequest(entity, dbName) {
    let db, objectStore;
    const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!indexedDB) {
      console.error('== Your browser dont support indexed databases ==');
    }
    const dbOpenRequest = indexedDB.open(`${dbName}-db`, 1);
    dbOpenRequest.onerror = (error) => {
      console.error('== Failed to open indexed database !');
      console.error('== error message', error.target);
      console.error('== error message', error.target);
    };
    dbOpenRequest.onsuccess = (event) => {
      db = event.target.result;
      if(db.transaction){
        const transaction = db.transaction(dbName, 'readwrite');
        transaction.oncomplete = event => {
          console.log('= event on transaction complete ==', event);
        }
        objectStore = transaction.objectStore(dbName);
        this.addToIndexedDB(objectStore, entity);
        return;
      }
    };
    dbOpenRequest.onupgradeneeded = (event) => {
      db = event.target.result;
        objectStore = db.createObjectStore(dbName, { keyPath: 'id' });
        if(dbName === 'restaurants'){
          objectStore.createIndex('name', 'name', { unique: false });
        }
        if(dbName === 'reviews'){
          objectStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
        }
        if(dbName === 'offline'){
          objectStore.createIndex('type', 'type', { unique: false });
        }
        objectStore.transaction.oncomplete = (event) => {
          objectStore = db.transaction([ dbName ], 'readwrite').objectStore(dbName);
          this.addToIndexedDB(objectStore, entity);
        };
    };
  };

  static openDBGetRequest(dbName, callback){
    const indexedDB =  window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      let objectStore, objectStoreRequest, db, data;
      const request = indexedDB.open(`${dbName}-db`, 1);
      request.onsuccess = event => {
        db = request.result;
        const transaction = db.transaction(dbName, 'readonly');
        transaction.oncomplete = event => {
          console.log('= event on transaction complete ==', event);
        }
        objectStore = transaction.objectStore(dbName);
        objectStoreRequest = objectStore.getAll();
        objectStoreRequest.onsuccess = event => {
          data = event.target.result;
          if(!data){
            console.error('Error while fetching reviews => ', error);
            callback(error, null);
            return;
          }
          callback(null, data);
        }
      }
  }

  static addToIndexedDB(store, objects){
    objects.forEach((object) => {
      store.add(object);
    });
  };

  // static getFromIndexedDB(store, keys){
  //   const results = keys.map(key => store.get(key));
  //   return results;
  // }
}
