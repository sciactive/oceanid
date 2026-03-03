export class Oceanid {
  public response: string;

  constructor(response: string) {
    this.response = response;
  }

  respond() {
    return this.response;
  }
}
