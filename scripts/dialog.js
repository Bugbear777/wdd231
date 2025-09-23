function displayCourseDetails(course){
    courseDetails.innerHTML = '';
    courseDetails.innerHTML = `
        <button id="close-btn">X</button>
        <h2>${course.subject}</h2>
        <h3>${course.title}</h3>
        <p><strong>Credits</strong>: ${course.credits}</p>
        <p><strong>Certificate</strong>: ${course.certificate}</p>
        <p>${course.description}</p>
        <p><strong>Technologies</strong>: ${course.technology.join(', ')}</p>
  `;
    courseDetails.showModal();
    closeModal.addEventListener('click', () => {
        courseDetails.close();
    });
}