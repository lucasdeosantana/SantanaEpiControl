// src/epis/dto/update-epi.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEpiDto } from './create-epi.dto';

export class UpdateEpiDto extends PartialType(CreateEpiDto) {}