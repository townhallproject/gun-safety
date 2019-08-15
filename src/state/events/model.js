export default class TownHall {
  constructor(props) {
    this.displayName = props.displayName;
    this.address = props.address;
    this.party = props.meetingType === 'Gun Safety Activist Event' ? 'activism' : props.party[0];
    this.date = props.dateString;
    this.time = props.Time;
    this.id = props.eventId;
    this.iconFlag = props.iconFlag;
    this.chamber = props.chamber;
    this.lat = props.lat;
    this.lng = props.lng;
    this.eventName = props.eventName;
    this.meetingType = props.meetingType;
    this.Location = props.Location;
    this.dateObj = props.dateObj;
    this.state = props.state;
    this.url = props.link;
    this.urlName = props.linkName;
    this.district = props.district;
    this.notes = props.Notes;
  }
}
