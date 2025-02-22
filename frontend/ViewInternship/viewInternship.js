document.addEventListener('DOMContentLoaded', () => {
  fetch('https://placify-ssn.vercel.app/api/faculty/view-internships', {
    method: 'GET',
  })
    .then(response => response.json())
    .then(data => {      
      if (data.success && data.internships && Array.isArray(data.internships) && data.internships.length > 0) {
        renderTable(data.internships);
      } else {
        console.error('No internships data available or an error occurred:', data);
        document.getElementById('table-container').innerHTML = '<p>No data available.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching data from backend:', error);
      document.getElementById('table-container').innerHTML = '<p>Error fetching data from backend.</p>';
    });
});

function renderTable(data) {
  const container = document.getElementById('table-container');
  
  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<p>No data available.</p>';
    return;
  }
  
  const table = document.createElement('table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = Object.keys(data[0]);
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach(item => {
    const row = document.createElement('tr');
    headers.forEach((key, index) => {
      const td = document.createElement('td');
      
      if (index >= headers.length - 2 && item[key]) {
        const link = document.createElement('a');
        link.href = item[key];
        link.textContent = 'View Document';
        link.target = '_blank'; 
        td.appendChild(link);
      } else {
        td.textContent = item[key] || '';
      }
      
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  container.innerHTML = '';
  container.appendChild(table);
}