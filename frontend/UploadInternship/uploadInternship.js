document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("uploadInternshipForm").addEventListener("submit", function(e) {
    const formData = new FormData(this);
    e.preventDefault();
    fetch("https://placify-ssn.vercel.app/api/student/upload", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("Internship details uploaded successfully!");
        this.reset();
      } else {
        alert("Failed to upload details: " + data.message);
      }
    })
    .then(() => {
      window.location.href = "/Home/home.html";
    })
    .catch(err => {
      console.error("Error uploading internship details:", err);
      alert("An error occurred while uploading details.");
    });
  });
});
