//load data
//sort data
//parse through and format while inserting to html


function fetchJSONData(route) {
    fetch('../sessions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();  
        })
        .then(data => console.log(data))  
        .catch(error => console.error('Failed to fetch data:', error)); 
}
fetchJSONData();

let leadBoard = document.getElementById("scores");

//sort original data - make a tree?
let sortBulk = () => {};

//sort new data
let sortNew = () => {};