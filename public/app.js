// Memori Frontend Application State
let allTopics = [];
let todayTopics = [];
let activeTab = 'today';

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  initDateDisplay();
  initDatePicker();
  refreshData();
});

// Initialize live date banner
function initDateDisplay() {
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  document.getElementById('live-date').textContent = now.toLocaleDateString('en-US', options);
}

// Initialize date picker input to local ISO date (YYYY-MM-DD)
function initDatePicker() {
  const dateInput = document.getElementById('revision-date-input');
  if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
  }
}

// Global data refresh
async function refreshData() {
  await Promise.all([fetchRevisionsBySelectedDate(), fetchAllTopics()]);
  updateDashboardStats();
}

// Fetch Revisions for currently selected date (using GET /revisions/:date or GET /revisions/today)
async function fetchRevisionsBySelectedDate() {
  const dateInput = document.getElementById('revision-date-input');
  const selectedDateStr = dateInput ? dateInput.value : '';

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const isToday = !selectedDateStr || selectedDateStr === todayStr;
  const endpoint = isToday ? '/revisions/today' : `/revisions/${selectedDateStr}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Failed to fetch revisions');
    const data = await response.json();
    todayTopics = data || [];

    // Update section title
    const heading = document.getElementById('revisions-heading');
    if (heading) {
      heading.textContent = isToday
        ? "Today's Revision Schedule"
        : `Revisions for ${formatDate(selectedDateStr)}`;
    }

    renderTodayTopics();
  } catch (err) {
    console.error('Error fetching revisions:', err);
    showToast('Failed to load revisions for selected date', 'error');
  }
}

// Reset date input back to today
function resetToTodayDate() {
  initDatePicker();
  fetchRevisionsBySelectedDate();
}

// Fetch All Topics
async function fetchAllTopics() {
  try {
    const response = await fetch('/getTopics');
    if (!response.ok) throw new Error('Failed to fetch topics');
    const data = await response.json();
    allTopics = data || [];
    renderAllTopics();
    updateDashboardStats();
  } catch (err) {
    console.error('Error fetching topics:', err);
    showToast('Failed to load topic vault', 'error');
  }
}

// Render Today's Revisions View
function renderTodayTopics() {
  const container = document.getElementById('today-topics-container');
  const countBadge = document.getElementById('badge-due-count');
  countBadge.textContent = todayTopics.length;

  if (todayTopics.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <h3 class="empty-title">All Caught Up For Today!</h3>
        <p class="empty-desc">No topics are currently due for review today. Great work staying on top of your memory retention schedule!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = todayTopics.map(topic => createTopicCardMarkup(topic, true)).join('');
}

// Render All Topics View
function renderAllTopics() {
  const container = document.getElementById('all-topics-container');
  const query = document.getElementById('search-input')?.value.toLowerCase().trim() || '';

  const filtered = allTopics.filter(t => 
    t.name.toLowerCase().includes(query) || 
    (t.description && t.description.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <h3 class="empty-title">${allTopics.length === 0 ? 'No Topics Found' : 'No Matching Results'}</h3>
        <p class="empty-desc">${allTopics.length === 0 ? 'Click "Add Topic" above to create your first learning card.' : 'Try adjusting your search filter.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(topic => createTopicCardMarkup(topic, false)).join('');
}

// HTML Card Generator
function createTopicCardMarkup(topic, isTodayView) {
  const stageInterval = topic.current_interval || 1;
  const stageClass = `stage-${stageInterval}`;
  const formattedNextDate = formatDate(topic.next_revision_date);

  return `
    <div class="topic-card" id="card-${topic.ID}">
      <div>
        <div class="topic-card-header">
          <h3 class="topic-title">${escapeHtml(topic.name)}</h3>
          <span class="stage-badge ${stageClass}">${stageInterval} ${stageInterval === 1 ? 'Day' : 'Days'}</span>
        </div>
        <p class="topic-desc">${escapeHtml(topic.description || 'No notes provided.')}</p>
      </div>

      <div>
        <div class="topic-meta">
          <span>Next: <strong>${formattedNextDate}</strong></span>
          <span>ID: #${topic.ID}</span>
        </div>
        <div class="topic-actions" style="margin-top: 12px;">
          <button class="btn btn-success btn-sm" onclick="incrementTopic(${topic.ID})" title="Mark reviewed & advance spaced interval">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Review & Advance
          </button>
          <button class="btn btn-reset btn-sm" onclick="resetTopic(${topic.ID})" title="Reset interval to 1 day">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
            Reset
          </button>
        </div>
      </div>
    </div>
  `;
}

// Update Dashboard Statistics
function updateDashboardStats() {
  document.getElementById('stat-total-topics').textContent = allTopics.length;
  document.getElementById('stat-due-today').textContent = todayTopics.length;
  
  if (allTopics.length > 0) {
    const avg = (allTopics.reduce((acc, curr) => acc + (curr.current_interval || 1), 0) / allTopics.length).toFixed(1);
    document.getElementById('stat-avg-interval').textContent = `Avg: ${avg}d`;
  } else {
    document.getElementById('stat-avg-interval').textContent = '1d - 28d';
  }
}

// Tab Switcher
function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  document.getElementById(`tab-btn-${tabName}`).classList.add('active');
  document.getElementById(`view-${tabName}`).classList.add('active');
}

// Action: Increment Topic Interval Stage
async function incrementTopic(id) {
  try {
    const response = await fetch(`/increment/${id}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to increment topic interval');
    
    showToast(`Topic #${id} interval advanced! 🎉`, 'success');
    await refreshData();
  } catch (err) {
    console.error('Error incrementing topic:', err);
    showToast('Failed to advance topic interval', 'error');
  }
}

// Action: Reset Topic Interval
async function resetTopic(id) {
  try {
    const response = await fetch(`/update/${id}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to reset topic interval');

    showToast(`Topic #${id} interval reset to 1 day`, 'success');
    await refreshData();
  } catch (err) {
    console.error('Error resetting topic:', err);
    showToast('Failed to reset topic interval', 'error');
  }
}

// Action: Create New Topic
async function handleCreateTopic(event) {
  event.preventDefault();
  const nameInput = document.getElementById('topic-name');
  const descInput = document.getElementById('topic-description');
  const submitBtn = document.getElementById('btn-submit-topic');

  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!name) {
    showToast('Please enter a topic name', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>Saving...</span>`;

  try {
    const response = await fetch('/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });

    if (!response.ok) throw new Error('Failed to create topic');

    showToast(`Topic "${name}" added to memory vault!`, 'success');
    nameInput.value = '';
    descInput.value = '';

    await refreshData();
    switchTab('today');
  } catch (err) {
    console.error('Error creating topic:', err);
    showToast('Failed to save topic', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      <span>Add Topic to Vault</span>
    `;
  }
}

// Filter topics list on search input
function filterTopics() {
  renderAllTopics();
}



// Helper: Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' 
        ? '<polyline points="20 6 9 17 4 12"></polyline>' 
        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: Format Date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}
