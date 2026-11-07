/* ==========================================================================
   Lineup: event data
   Dates are ISO strings in local time. Keep them in the future to see
   countdowns running; past events are marked "Started".
   ========================================================================== */

const CATEGORIES = ["All", "Tech", "Music", "Sports", "Arts", "Workshop"];

const EVENTS = [
  {
    id: "hack-n-build",
    name: "Hack & Build 48",
    category: "Tech",
    date: "2026-11-14T09:00:00",
    endDate: "2026-11-16T09:00:00",
    venue: "Campus 15 Auditorium",
    short: "A 48 hour build sprint. Teams of four, one problem statement, real users at the demo.",
    description: "Hack & Build is the flagship 48 hour hackathon of the semester. Teams receive the problem statement at 9am on Saturday and present working demos on Monday morning to a panel of alumni engineers and product leads. Mentors are available around the clock, meals are provided, and the venue stays open through the night. Bring a laptop, a charger and at least one teammate who can stay awake.",
    featured: true,
    capacity: 200,
    hue: 228,
    pattern: "grid"
  },
  {
    id: "open-mic-nights",
    name: "Open Mic: Late Edition",
    category: "Music",
    date: "2026-11-12T19:30:00",
    endDate: "2026-11-12T22:30:00",
    venue: "Rooftop Cafe, Block 7",
    short: "Three hours, fifteen slots, no setlists. Sign up at the door or online.",
    description: "The monthly open mic moves to the rooftop for the cooler evenings. Fifteen performance slots of eight minutes each for singers, instrumentalists, poets and anyone in between. A basic PA, two mics and a keyboard are provided. Slots are first come first served, so registering early gets you an earlier spot on the list.",
    featured: false,
    capacity: 120,
    hue: 320,
    pattern: "rings"
  },
  {
    id: "inter-hostel-football",
    name: "Inter Hostel Football Finals",
    category: "Sports",
    date: "2026-11-21T16:00:00",
    endDate: "2026-11-21T19:00:00",
    venue: "Main Ground",
    short: "The final two hostels face off under the floodlights. Stands open at 3pm.",
    description: "After six weeks of group stages and knockouts, the two remaining hostels play for the inter hostel cup. The match kicks off at 4pm with the trophy presentation to follow. Stands open an hour before kickoff. Face paint and banners are encouraged; flares and loud instruments are not. Register to reserve a seat in the covered stand.",
    featured: true,
    capacity: 800,
    hue: 140,
    pattern: "stripes"
  },
  {
    id: "figma-to-code",
    name: "From Figma to Code",
    category: "Workshop",
    date: "2026-11-10T14:00:00",
    endDate: "2026-11-10T17:00:00",
    venue: "Lab 3, Campus 11",
    short: "Turn a real design file into a responsive page in one afternoon, step by step.",
    description: "A hands on workshop for anyone who has a design and does not know how to ship it. We start with a complete Figma file, break it into a layout plan, and build it out in plain HTML and CSS with a focus on responsive behaviour and accessibility. No framework needed. Laptops required; a Figma account is useful but not essential.",
    featured: false,
    capacity: 40,
    hue: 24,
    pattern: "dots"
  },
  {
    id: "winter-exhibition",
    name: "Winter Print Exhibition",
    category: "Arts",
    date: "2026-11-28T11:00:00",
    endDate: "2026-11-30T18:00:00",
    venue: "Gallery Wing, Library",
    short: "Three days of student printmaking, photography and zines. Free entry.",
    description: "The Fine Arts Society opens its winter exhibition with over sixty works from students across departments, including screen prints, risograph zines and a photography wall curated around the theme of 'commute'. The opening afternoon includes a short talk by the exhibiting artists. Entry is free; registering helps the society plan the opening and send you a reminder.",
    featured: false,
    capacity: 300,
    hue: 270,
    pattern: "rings"
  },
  {
    id: "ml-reading-group",
    name: "ML Reading Group: Diffusion Models",
    category: "Tech",
    date: "2026-11-18T18:00:00",
    endDate: "2026-11-18T19:30:00",
    venue: "Seminar Room 2, Campus 12",
    short: "Ninety minutes on one paper. Read it beforehand, argue about it in the room.",
    description: "The reading group picks one paper a fortnight and discusses it properly. This session covers the original denoising diffusion paper and one follow up on faster sampling. A short summary is presented in the first fifteen minutes, then the floor is open. Newcomers are welcome; the only rule is that you have read at least the abstract and the figures.",
    featured: false,
    capacity: 35,
    hue: 200,
    pattern: "grid"
  },
  {
    id: "battle-of-bands",
    name: "Battle of the Bands",
    category: "Music",
    date: "2026-12-05T18:00:00",
    endDate: "2026-12-05T22:00:00",
    venue: "Open Air Theatre",
    short: "Eight bands, one stage, a crowd vote and a judges' pick. Gates open at 5pm.",
    description: "Eight student bands selected from the autumn auditions play twenty minute sets at the open air theatre. Two winners are chosen: one by the audience through a live vote, one by a panel of three musicians from the city circuit. The winning bands headline the spring festival. Registration gets you a wristband and a vote.",
    featured: true,
    capacity: 1500,
    hue: 350,
    pattern: "stripes"
  },
  {
    id: "yoga-sunrise",
    name: "Sunrise Yoga on the Lawn",
    category: "Sports",
    date: "2026-11-15T06:15:00",
    endDate: "2026-11-15T07:15:00",
    venue: "Central Lawn",
    short: "An hour of guided movement before the campus wakes up. Mats provided.",
    description: "A beginner friendly outdoor session led by the campus wellness team. The hour includes gentle warm ups, a short flow, and ten minutes of guided breathing to finish. Mats and water are provided; wear something you can move in and arrive five minutes early. Sessions run on alternate Sundays through the winter.",
    featured: false,
    capacity: 60,
    hue: 50,
    pattern: "dots"
  },
  {
    id: "public-speaking",
    name: "Speak Without Notes",
    category: "Workshop",
    date: "2026-11-25T15:00:00",
    endDate: "2026-11-25T17:30:00",
    venue: "Room 104, Campus 3",
    short: "A practical session on structuring and delivering a talk you can give without slides.",
    description: "Run by the debating society, this workshop covers how to build a talk from a single idea, how to remember it without reading, and how to handle a room that is not paying attention. Everyone delivers a two minute talk at the end and gets specific feedback. Small group, so register early.",
    featured: false,
    capacity: 25,
    hue: 180,
    pattern: "rings"
  }
];

/**
 * Builds an abstract SVG "poster" for an event so every card has an image
 * without depending on external files. Returns a data URI.
 */
function eventArt(event) {
  const h = event.hue;
  const bg = `hsl(${h} 70% 52%)`;
  const ink = `hsl(${(h + 200) % 360} 60% 18%)`;
  const pop = `hsl(${(h + 40) % 360} 95% 70%)`;
  let shapes = "";

  switch (event.pattern) {
    case "grid":
      for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 4; y++) {
          const on = (x * 3 + y * 5 + h) % 4 === 0;
          shapes += `<rect x="${x * 100 + 10}" y="${y * 100 + 10}" width="80" height="80" rx="${on ? 40 : 6}" fill="${on ? pop : ink}" opacity="${on ? 1 : 0.85}"/>`;
        }
      }
      break;
    case "rings":
      for (let i = 0; i < 6; i++) {
        shapes += `<circle cx="${420 - i * 20}" cy="${200 + (i % 2) * 20}" r="${180 - i * 28}" fill="none" stroke="${i % 2 ? pop : ink}" stroke-width="18"/>`;
      }
      shapes += `<circle cx="110" cy="110" r="70" fill="${pop}"/>`;
      break;
    case "stripes":
      for (let i = -3; i < 9; i++) {
        shapes += `<path d="M${i * 90} 0 L${i * 90 + 60} 0 L${i * 90 + 260} 400 L${i * 90 + 200} 400 Z" fill="${i % 2 ? ink : pop}" opacity="${i % 2 ? 0.9 : 1}"/>`;
      }
      shapes += `<rect x="330" y="60" width="200" height="200" rx="100" fill="${bg}" stroke="${ink}" stroke-width="16"/>`;
      break;
    case "dots":
    default:
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 7; y++) {
          const r = ((x + y + h) % 5) * 5 + 6;
          shapes += `<circle cx="${x * 66 + 33}" cy="${y * 60 + 30}" r="${r}" fill="${(x + y) % 3 ? ink : pop}"/>`;
        }
      }
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice"><rect width="600" height="400" fill="${bg}"/>${shapes}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
