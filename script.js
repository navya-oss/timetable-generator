if (!sessionStorage.getItem('initialized')) {
  localStorage.removeItem('teachers');
  localStorage.removeItem('classes');
  sessionStorage.setItem('initialized', 'true');
}

let teachers = JSON.parse(localStorage.getItem('teachers')) || [];
let classes = JSON.parse(localStorage.getItem('classes')) || [];

if (!teachers || teachers.length === 0) {
  teachers = [];
  localStorage.setItem('teachers', JSON.stringify(teachers));
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '8:00 - 9:00',
  '9:00 - 10:00',
  '10:00 - 10:15',  // Break
  '10:15 - 11:15',
  '12:15 - 1:15',
  '1:15 - 2:15',    // Lunch
  '2:15 - 3:15',
  '3:15 - 4:15',
  '4:15 - 5:15'
];

let timetables = {};
let globalTeacherSchedule = {};

function updateClassSelect() {
  const select = document.getElementById('class-select');
  if (!select) return; // Check if element exists (safe)
  select.innerHTML = '';
  classes.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.name;
    option.textContent = cls.name;
    select.appendChild(option);
  });
}

function addTeacher() {
  const name = document.getElementById('teacher-name').value.trim();
  const subjectInput = document.getElementById('teacher-subjects').value.trim();

  if (!name || !subjectInput) {
    alert("Please enter both teacher name and subjects.");
    return;
  }

  const subjects = subjectInput.split(',').map(s => s.trim()).filter(s => s);
  if (subjects.length === 0) {
    alert("Please enter at least one subject.");
    return;
  }

  teachers.push({ name, canTeach: subjects });
  localStorage.setItem('teachers', JSON.stringify(teachers));

  document.getElementById('teacher-name').value = '';
  document.getElementById('teacher-subjects').value = '';
  displayTeachers();
}

// 🚀 New Function: Check before moving from teacher page
function validateTeachersBeforeNext() {
  if (teachers.length < 7) {
    alert("Please enter the details of teachers.");
    return false;
  }
  return true;
}

function addClass() {
  let classes = [];
  const level = document.getElementById('class-level').value;
  const section = document.getElementById('section-name').value.trim();
  const subjectList = document.getElementById('class-subjects').value.split(',').map(s => s.trim()).filter(s => s);

  if (!level || !section || subjectList.length === 0) {
    alert("Details are not filled.");
    return;
  }

  const fullClassName = `${level} ${section}`;
  classes.push({ name: fullClassName, subjects: subjectList });
  localStorage.setItem('classes', JSON.stringify(classes));
  alert(`Class "${fullClassName}" added.`);
  document.getElementById('section-name').value = '';
  document.getElementById('class-subjects').value = '';
  updateClassSelect();
}

// 🚀 New Function: Check before moving from class page
function validateClassesBeforeNext() {
  if (classes.length === 0) {
    alert("Details are not filled.");
    return false;
  }
  return true;
}

function displayTeachers() {
  const container = document.getElementById('teacher-list');
  if (!container) return;
  
  if (teachers.length === 0) {
    container.innerHTML = "No teachers added yet.";
  } else {
    container.innerHTML = "";
    teachers.forEach((teacher, index) => {
      container.innerHTML += `<div><strong>${index + 1}. ${teacher.name}</strong>: ${teacher.canTeach.join(', ')}</div>`;
    });
  }
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateTimetable() {
  // 🚀 Check for missing data before generating
  if (teachers.length < 7) {
    alert('Please add at least 7 teachers before generating timetable.');
    return;
  }

  if (classes.length === 0) {
    alert('Please add class details before generating timetable.');
    return;
  }

  globalTeacherSchedule = {};
  timetables = {};

  const selectedClass = document.getElementById('class-select').value;
  const cls = classes.find(c => c.name === selectedClass);
  if (!cls) {
    alert('Please select a class to generate the timetable.');
    return;
  }

  const timetable = [];

  for (let day = 0; day < days.length; day++) {
    let dailySchedule = [];
    const subjectPool = [];
    const periodsNeeded = timeSlots.filter(slot => slot !== '10:00 - 10:15' && slot !== '1:15 - 2:15').length;

    while (subjectPool.length < periodsNeeded) {
      subjectPool.push(...cls.subjects);
    }
    subjectPool.length = periodsNeeded;
    const shuffledSubjects = shuffleArray(subjectPool);

    let periodIndex = 0;

    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      const key = `${days[day]}-${i}`;

      if (slot === '10:00 - 10:15') {
        dailySchedule.push({ day: days[day], subject: 'Break', teacher: '-' });
      } else if (slot === '1:15 - 2:15') {
        dailySchedule.push({ day: days[day], subject: 'Lunch Break', teacher: '-' });
      } else {
        const subject = shuffledSubjects[periodIndex++];
        const availableTeacher = teachers.find(t =>
          t.canTeach.includes(subject) &&
          !Object.values(globalTeacherSchedule[key] || {}).includes(t.name)
        );

        if (availableTeacher) {
          if (!globalTeacherSchedule[key]) globalTeacherSchedule[key] = [];
          globalTeacherSchedule[key].push(availableTeacher.name);
          dailySchedule.push({ day: days[day], subject, teacher: availableTeacher.name });
        } else {
          dailySchedule.push({ day: days[day], subject, teacher: 'No Teacher Available' });
        }
      }
    }
    timetable[day] = dailySchedule;
  }

  timetables[selectedClass] = timetable;
  displayTimetable();
}

function displayTimetable() {
  const className = document.getElementById('class-select').value;
  const timetable = timetables[className] || [];

  let html = `<table border="1" cellspacing="0" cellpadding="8">`;
  html += `<tr><th>Day</th>`;
  timeSlots.forEach(slot => html += `<th>${slot}</th>`);
  html += `</tr>`;

  timetable.forEach((daySchedule, i) => {
    html += `<tr><td><strong>${days[i]}</strong></td>`;
    daySchedule.forEach(period => {
      html += `<td>${period.subject}<br><em>${period.teacher}</em></td>`;
    });
    html += `</tr>`;
  });

  html += `</table>`;
  const output = document.getElementById('timetable-output');
  if (output) {
    output.innerHTML = html;
  }
}

// Initial calls
updateClassSelect();
displayTeachers();
