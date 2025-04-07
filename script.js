// Define data structure
class PriceTracker {
    constructor() {
      this.loadProducts();
    }
  
    // Load products from localStorage
    loadProducts() {
      this.products = JSON.parse(localStorage.getItem('trackedProducts')) || [];
    }
  
    // Save products to localStorage
    saveProducts() {
      localStorage.setItem('trackedProducts', JSON.stringify(this.products));
    }
  
    // Add a new product
    addProduct(name, price) {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check if product already exists
      const existingProduct = this.products.find(p => p.name === name);
      
      if (existingProduct) {
        // Update existing product with new price point
        existingProduct.priceHistory.push({
          date: date,
          price: price
        });
        existingProduct.lastPrice = price;
      } else {
        // Add new product
        this.products.push({
          name: name,
          lastPrice: price,
          priceHistory: [{
            date: date,
            price: price
          }]
        });
      }
      
      this.saveProducts();
      return true;
    }
  
    // Remove a product
    removeProduct(name) {
      const initialLength = this.products.length;
      this.products = this.products.filter(p => p.name !== name);
      
      if (this.products.length < initialLength) {
        this.saveProducts();
        return true;
      }
      return false;
    }
  
    // Get all tracked products
    getAllProducts() {
      return this.products;
    }
  
    // Get price comparison (current vs previous day)
    getPriceComparison(name) {
      const product = this.products.find(p => p.name === name);
      if (!product || product.priceHistory.length < 2) {
        return { 
          currentPrice: product?.lastPrice || null,
          previousPrice: null,
          difference: null,
          percentChange: null
        };
      }
      
      const history = product.priceHistory;
      const currentPrice = parseFloat(product.lastPrice);
      const previousPrice = parseFloat(history[history.length - 2].price);
      const difference = currentPrice - previousPrice;
      const percentChange = (difference / previousPrice) * 100;
      
      return {
        currentPrice,
        previousPrice,
        difference: difference.toFixed(2),
        percentChange: percentChange.toFixed(2)
      };
    }
  }
  
  // Initialize the tracker
  const tracker = new PriceTracker();
  
  // API Functions
  async function fetchProductData(name) {
    const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(name)}&page=1&country=US&sort_by=RELEVANCE&product_condition=ALL&is_prime=false`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '',
        'x-rapidapi-host': ''
      }
    };
  
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      return result.data.products;
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  }
  
  // UI Functions
  async function searchProducts() {
    const searchTerm = document.getElementById('name').value;
    if (!searchTerm) return;
    
    document.getElementById('searchResults').style.display = 'block';
    document.getElementById('searchResultsList').innerHTML = '<li>Searching...</li>';
    
    const products = await fetchProductData(searchTerm);
    
    if (products.length === 0) {
      document.getElementById('searchResultsList').innerHTML = '<li>No products found</li>';
      return;
    }
    
    document.getElementById('searchResultsList').innerHTML = products.map((item, index) => {
      const price = item.product_price ? item.product_price.replace(/[^\d.]/g, '') : 'N/A';
      return `
        <li>
          ${item.product_title} 
          <span class="price">$${price}</span>
          <button onclick="trackProduct('${item.product_title.replace(/'/g, "\\'")}', '${price}')">Track</button>
        </li>
      `;
    }).join('');
  }
  
  function trackProduct(name, price) {
    tracker.addProduct(name, price);
    displayTrackedProducts();
    document.getElementById('searchResults').style.display = 'none';
  }
  
  function displayTrackedProducts() {
    const products = tracker.getAllProducts();
    const productsList = document.getElementById('trackedProductsList');
    
    if (products.length === 0) {
      productsList.innerHTML = '<li>No products tracked yet</li>';
      return;
    }
    
    productsList.innerHTML = products.map(product => {
      const comparison = tracker.getPriceComparison(product.name);
      let priceChangeHtml = '';
      
      if (comparison.previousPrice !== null) {
        const changeDirection = comparison.difference < 0 ? 'down' : 'up';
        priceChangeHtml = `
          <div class="price-change ${changeDirection}">
            ${changeDirection === 'down' ? '↓' : '↑'} $${Math.abs(comparison.difference)} 
            (${Math.abs(comparison.percentChange)}%)
          </div>
        `;
      }
      
      return `
        <li>
          <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-price">Current: $${product.lastPrice}</div>
            ${priceChangeHtml}
          </div>
          <div class="product-actions">
            <button onclick="removeProduct('${product.name.replace(/'/g, "\\'")}')">Remove</button>
            <button onclick="updatePrice('${product.name.replace(/'/g, "\\'")}')">Update Price</button>
          </div>
        </li>
      `;
    }).join('');
  }
  
  async function updatePrice(name) {
    const products = await fetchProductData(name);
    if (products.length > 0) {
      const price = products[0].product_price.replace(/[^\d.]/g, '');
      tracker.addProduct(name, price);
      displayTrackedProducts();
      showToast(`Updated price for ${name}`);
    } else {
      showToast('Could not update price. Product not found.');
    }
  }
  
  function removeProduct(name) {
    if (tracker.removeProduct(name)) {
      displayTrackedProducts();
      showToast(`Removed ${name} from tracking`);
    }
  }
  
  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  // Initialize the UI when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    document.getElementById('searchButton').addEventListener('click', searchProducts);
    document.getElementById('name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchProducts();
    });
    
    // Display any products already being tracked
    displayTrackedProducts();
  });