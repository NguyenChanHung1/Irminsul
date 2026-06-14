import { Controller, Get, Param, Query } from '@nestjs/common';
import { ResourcesService } from './resources.service';

@Controller('api')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('characters')
  listCharacters(@Query() query: Record<string, string | undefined>) {
    return this.resourcesService.listCharacters(query);
  }

  @Get('characters/:id')
  getCharacter(@Param('id') id: string) {
    return this.resourcesService.getCharacter(id);
  }

  @Get('weapons')
  listWeapons(@Query() query: Record<string, string | undefined>) {
    return this.resourcesService.listWeapons(query);
  }

  @Get('weapons/:id')
  getWeapon(@Param('id') id: string) {
    return this.resourcesService.getWeapon(id);
  }

  @Get('artifacts')
  listArtifacts(@Query() query: Record<string, string | undefined>) {
    return this.resourcesService.listArtifacts(query);
  }

  @Get('artifacts/:id')
  getArtifact(@Param('id') id: string) {
    return this.resourcesService.getArtifact(id);
  }

  @Get('materials')
  listMaterials(@Query() query: Record<string, string | undefined>) {
    return this.resourcesService.listMaterials(query);
  }

  @Get('enemies')
  listEnemies(@Query() query: Record<string, string | undefined>) {
    return this.resourcesService.listEnemies(query);
  }

  @Get('dungeons')
  listDungeons(@Query() query: Record<string, string | undefined>) {
    return this.resourcesService.listDungeons(query);
  }
}
