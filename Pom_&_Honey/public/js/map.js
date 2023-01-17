/**
 * Create a Google Map directing the user to Pom and Honey.
 */
function myMap() {
    var location = new google.maps.LatLng(30.612448686913215, -96.34127527360305);
    var mapProp= {
        center:location,
        zoom:15,
    };

    var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);

    new google.maps.Marker({
        position: location,
        map,
        title: "Pom and Honey",
    });
}
