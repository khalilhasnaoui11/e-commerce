import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class JsonStorageService {
  private readonly basePath = path.join(process.cwd(), 'src', 'data');

  private getFilePath(file: string): string {
    return path.join(this.basePath, file);
  }

  async read<T>(file: string): Promise<T[]> {
    const filePath = this.getFilePath(file);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async write<T>(file: string, data: T[]): Promise<void> {
    const filePath = this.getFilePath(file);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
