document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');
    const errorMessageP = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Hide previous errors, show loading spinner
        errorDiv.style.display = 'none';
        loadingSpinner.style.display = 'flex';
        
        // Gather form data
        const formData = new FormData(loginForm);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = "/home";  // Redirect to home page after login
            } else {
                errorMessageP.textContent = result.message || 'Invalid username or password.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorMessageP.textContent = 'Failed to connect to the server. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');
    const errorMessageP = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
            
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
                
        // Hide previous errors, show loading spinner
        errorDiv.style.display = 'none';
        loadingSpinner.style.display = 'flex';
                
        // Gather form data
        const formData = new FormData(loginForm);
        const data = {};
                
        // Convert FormData to JSON object
        for (const [key, value] of formData.entries()) {
        data[key] = value;
        }
                
        try {
        setTimeout(() => {
        // Hide loading spinner
        loadingSpinner.style.display = 'flex';
                        
        // Redirect to home page on successful login
        window.location.href = '/home';
                        
        }, 1000);
                    
        } catch (error) {
        // Hide loading spinner
        loadingSpinner.style.display = 'none';
                    
        // Show error message
        errorMessageP.textContent = 'Failed to connect to the server. Please try again later.';
        errorDiv.style.display = 'block';
        }
        });
            
        // Input validation
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
        
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
    });

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const predictionForm = document.getElementById('predictionForm');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const predictedPriceSpan = document.getElementById('predictedPrice');
    const errorMessageP = document.getElementById('errorMessage');
    const orderNumberInput = document.getElementById('orderNumber');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Form submission handler
    predictionForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Hide previous results and errors, show loading spinner
        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        loadingSpinner.style.display = 'flex';
        
        // Gather form data
        const formData = new FormData(predictionForm);
        const data = {};
        
        // Convert FormData to JSON object
        for (const [key, value] of formData.entries()) {
            // Only include fields with values
            if (value !== '') {
                // Convert number inputs to numeric values
                if (key === 'Order Number' || 
                    key === 'Order Subtotal Amount' || 
                    key === 'Order Total Tax Amount' || 
                    key === 'Item Cost' || 
                    key === 'Cart Discount Amount') {
                    data[key] = parseFloat(value);
                } else {
                    data[key] = value;
                }
            }
        }
        
        try {
            // Send request to the prediction API
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            // Hide loading spinner
            loadingSpinner.style.display = 'none';
            
            if (result.error) {
                // Show error message
                errorMessageP.textContent = result.error;
                errorDiv.style.display = 'block';
            } else {
                // Format and show prediction result
                predictedPriceSpan.textContent = parseFloat(result["Predicted Price"]).toFixed(2);
                resultDiv.style.display = 'block';
                
                // Scroll to result if needed
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (error) {
            // Hide loading spinner
            loadingSpinner.style.display = 'none';
            
            // Show error message for network or server issues
            errorMessageP.textContent = 'Failed to connect to the server. Please try again later.';
            errorDiv.style.display = 'block';
        }
    });
    
    function fetchOrderDetails() {
        let orderNumber = document.getElementById("orderNumber").value;
        if (!orderNumber) return;

        document.getElementById("loadingOrderDetails").style.display = "block";

        fetch(`/get_order_details?order_number=${orderNumber}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById("loadingOrderDetails").style.display = "none";

                if (data.error) {
                    console.error("Error:", data.error);
                    return;
                }

                document.getElementById("orderSubtotal").value = data["Order Subtotal Amount"] || "";
                document.getElementById("orderTaxAmount").value = data["Order Total Tax Amount"] || "";
                document.getElementById("itemCost").value = data["Item Cost"] || "";
            })
            .catch(error => {
                document.getElementById("loadingOrderDetails").style.display = "none";
                console.error("Fetch error:", error);
            });
    }    
    // Add input validation and formatting
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Remove non-numeric characters except decimal point
            this.value = this.value.replace(/[^0-9.]/g, '');
            
            // Ensure only one decimal point
            const parts = this.value.split('.');
            if (parts.length > 2) {
                this.value = parts[0] + '.' + parts.slice(1).join('');
            }
        });
    });
    
    // State code validation - limit to 2 characters and uppercase
    const stateCodeInput = document.getElementById('stateCode');
    stateCodeInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
        if (this.value.length > 2) {
            this.value = this.value.slice(0, 2);
        }
    });
    
    // Auto-fill functionality based on Order Number
    orderNumberInput.addEventListener('blur', function() {
        const orderNumber = this.value;
        const orderSubtotal = document.getElementById('orderSubtotal');
        const orderTaxAmount = document.getElementById('orderTaxAmount');
        const itemCost = document.getElementById('itemCost');
        
        if (orderNumber && !orderSubtotal.value && !orderTaxAmount.value && !itemCost.value) {
            // Add visual indication that auto-fill might occur
            const formGroups = document.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                const input = group.querySelector('input:not(#orderNumber)');
                if (input && !input.value) {
                    group.classList.add('auto-fill-pending');
                    setTimeout(() => {
                        group.classList.remove('auto-fill-pending');
                    }, 1500);
                }
            });
            
            console.log(`Order number ${orderNumber} entered - backend will auto-fill details`);
        }
    });
    
    // Add visual feedback for form interactions
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Optional: Add button to clear form
    const addClearButton = () => {
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'btn-clear';
        clearButton.innerHTML = '<i class="fas fa-times"></i> Clear Form';
        clearButton.style.backgroundColor = '#f8f9fa';
        clearButton.style.color = '#6c757d';
        clearButton.style.border = '1px solid #ced4da';
        clearButton.style.marginTop = '10px';
        clearButton.style.width = '100%';
        clearButton.style.padding = '10px';
        clearButton.style.borderRadius = '5px';
        clearButton.style.cursor = 'pointer';
        
        clearButton.addEventListener('click', () => {
            predictionForm.reset();
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
        });
        
        predictionForm.appendChild(clearButton);
    };
    
    // Uncomment this line if you want to add a clear form button
    // addClearButton();
});