
async function fetchData(name) {

    // const name = document.getElementById('name').value;
    console.log(name)

    const url = 'https://real-time-amazon-data.p.rapidapi.com/search?query='+name+'&page=1&country=US&sort_by=RELEVANCE&product_condition=ALL&is_prime=false';
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': '9feeb2c5admshe3d64acffd940eep1bfa6ejsn60fdcca62ca4',
		'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
	}
};

try {
	const response = await fetch(url, options);
	const result = await response.json();
    const out = result.data.products.map(item => item.product_title);
    console.log(out)
    document.getElementById('products').innerHTML = result.data.products.map(
        item => `<li>${item.product_title}: ${item.product_price}</li>`
        ).join('');
} catch (error) {
	console.error(error);
}

}

console.log("in Script")

var buttn = document.getElementById("button");
buttn.addEventListener("click", function() {
    var nae = document.getElementById("name").value;
    fetchData(nae)
});
