import { Uri } from "vscode";
import { Resource } from "../resource";
import { Command } from "./command";

export class OpenResourceBase extends Command {
  constructor() {
    super("svn.openResourceBase");
  }

  public async execute(
    resourceOrUri?: Resource | Uri,
    type?: string,
    renameResourceUri?: Uri,
    props?: string,
    remote: boolean = false
  ) {
    let resource: Resource | undefined;

    if (resourceOrUri instanceof Resource) {
      resource = resourceOrUri;
    } else if (resourceOrUri instanceof Uri) {
      resource = new Resource(
        resourceOrUri,
        type ?? "",
        renameResourceUri,
        props,
        remote
      );
    } else {
      resource = await this.getSCMResource();
    }

    if (!resource) {
      return;
    }

    await this._openResource(resource, "BASE", undefined, true, false);
  }
}
