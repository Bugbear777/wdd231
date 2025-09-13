const url = 'https://byui-cse.github.io/cse-ww-program/data/latter-day-prophets.json';
const cards = document.querySelector('#cards');

async function getProphetData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // console.table(data.prophets);

    // send the prophets array (not the whole data object) to the display function
    displayProphets(data.prophets);
  } catch (error) {
    console.error('Error fetching prophet data:', error);
  }
}

getProphetData()

const displayProphets = (prophets) => {
  prophets.forEach((prophet) => {
    // create the elements
    let card = document.createElement('section');
    let fullName = document.createElement('h2');
    let portrait = document.createElement('img');

    // build the heading text (concatenate first + last name)
    fullName.textContent = `${prophet.name} ${prophet.lastname}`;

    // build the image element attributes
    // NOTE: the JSON typically uses a property named "imageurl" for the portrait URL
    portrait.setAttribute('src', prophet.imageurl);
    portrait.setAttribute('alt', `Portrait of ${prophet.name} ${prophet.lastname}`);
    portrait.setAttribute('loading', 'lazy');
    portrait.setAttribute('width', '340');
    portrait.setAttribute('height', '440');

    // append heading and portrait to the card section
    card.appendChild(fullName);
    card.appendChild(portrait);

    // (Optional) add additional info — uncomment if you want birth/birthplace shown:
    // let birthInfo = document.createElement('p');
    // birthInfo.textContent = `${prophet.birthdate} — ${prophet.birthplace}`;
    // card.appendChild(birthInfo);

    // append the card to the cards container
    cards.appendChild(card);
  });
};