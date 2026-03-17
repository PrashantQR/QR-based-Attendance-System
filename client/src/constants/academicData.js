export const academicData = {
  MCA: {
    'Sem 1': ['Programming in C', 'Mathematics', 'DBMS'],
    'Sem 2': ['Java', 'Data Structures', 'OS'],
    'Sem 3': ['Python', 'Computer Networks'],
    'Sem 4': ['AI', 'Machine Learning']
  },
  BCA: {
    'Sem 1': ['Basics of IT', 'C Programming'],
    'Sem 2': ['Data Structures', 'Web Dev'],
    'Sem 3': ['Java', 'DBMS'],
    'Sem 4': ['Python', 'Networking'],
    'Sem 5': ['Cloud', 'AI Basics'],
    'Sem 6': ['Project', 'Cyber Security']
  }
};

export const mapSemesterToYear = (semesterLabel) => {
  if (!semesterLabel) return '';
  const semNumber = parseInt(semesterLabel.replace(/\D/g, ''), 10);
  if (!semNumber) return '';
  if (semNumber === 1 || semNumber === 2) return 'FY';
  if (semNumber === 3 || semNumber === 4) return 'SY';
  if (semNumber === 5 || semNumber === 6) return 'TY';
  if (semNumber === 7 || semNumber === 8) return 'Final Year';
  return '';
};

