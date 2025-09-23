// Dynamically display the current year
document.getElementById("currentyear").textContent = new Date().getFullYear();

// Dynamically display last modified date
document.getElementById("lastModified").textContent = "Last Modified: " + document.lastModified;

// Set the value of a hidden input field to the current timestamp in ISO format
document.getElementById('timestamp').value = new Date().toISOString();
