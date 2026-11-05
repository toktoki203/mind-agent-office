// Original vector chibi avatars. No external images, licenses or API calls required.
export function avatarSvg(agent, size = 'normal') {
  const hair = agent.hair;
  const skin = agent.skin;
  const accent = agent.color;
  const accessories = {
    leader: '<path d="M48 40q-4-23 24-26 26-2 34 22l-17-8-29 11z" fill="#483d83"/><path d="M69 11l6-9 6 9 10 2-8 7 2 10-10-6-10 6 2-10-8-7z" transform="translate(18 6) scale(.45)" fill="#f8d88d"/>',
    glasses: '<path d="M51 75h18m14 0h17" stroke="#554550" stroke-width="3"/><rect x="43" y="66" width="27" height="20" rx="9" fill="none" stroke="#554550" stroke-width="3"/><rect x="81" y="66" width="27" height="20" rx="9" fill="none" stroke="#554550" stroke-width="3"/>',
    beret: '<ellipse cx="80" cy="36" rx="45" ry="17" transform="rotate(-9 80 36)" fill="#d66d99"/><circle cx="80" cy="22" r="5" fill="#b8507f"/>',
    headset: '<path d="M46 74v-7a34 34 0 0168 0v7" stroke="#404661" stroke-width="8" fill="none"/><rect x="41" y="70" width="11" height="25" rx="5" fill="#404661"/><rect x="108" y="70" width="11" height="25" rx="5" fill="#404661"/><path d="M110 92q-1 16-20 16" fill="none" stroke="#404661" stroke-width="3"/>',
    cap: '<path d="M40 48q0-36 38-36 40 0 41 35-30 12-79 1" fill="#475b86"/><path d="M63 44h72q0 14-29 16H65z" fill="#3d517c"/><path d="M73 30h16" stroke="#cfdefc" stroke-width="5" stroke-linecap="round"/>'
  };
  const accessory = accessories[agent.variant] || '';
  const className = size === 'mini' ? 'avatar-svg avatar-mini' : 'avatar-svg';
  return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170" role="img" aria-label="Avatar chibi ${agent.name}">
    <ellipse cx="80" cy="159" rx="51" ry="8" fill="#26364a" opacity=".10"/>
    <path d="M23 157q0-45 57-45t57 45z" fill="${accent}"/>
    <path d="M80 115l-16 16 16 20 16-20z" fill="#ffffff" opacity=".80"/>
    <path d="M31 149q5-18 18-22m80 22q-5-18-18-22" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".36"/>
    <rect x="68" y="105" width="24" height="21" rx="9" fill="${skin}"/>
    <ellipse cx="80" cy="73" rx="44" ry="46" fill="${hair}"/>
    <path d="M41 75q0-45 39-45 43 0 39 49v14q-8 29-39 29T41 92z" fill="${skin}"/>
    <ellipse cx="40" cy="86" rx="8" ry="11" fill="${skin}"/><ellipse cx="120" cy="86" rx="8" ry="11" fill="${skin}"/>
    <path d="M39 62q-7-38 29-43 33-5 50 25l-9 21q-15-2-26-19-18 18-44 16" fill="${hair}"/>
    <ellipse cx="55" cy="92" rx="11" ry="6" fill="#ee8f93" opacity=".34"/>
    <ellipse cx="105" cy="92" rx="11" ry="6" fill="#ee8f93" opacity=".34"/>
    <path d="M57 78v5m46-5v5" stroke="#382e3e" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M75 96q5 5 10 0" fill="none" stroke="#ad6c6b" stroke-width="2.8" stroke-linecap="round"/>
    ${accessory}
    <path d="M47 150h66" stroke="#ffffff" stroke-width="4" opacity=".20" stroke-linecap="round"/>
  </svg>`;
}
