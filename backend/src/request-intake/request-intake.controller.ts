import { Body, Controller, Post } from '@nestjs/common';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { RequestIntakeService } from './request-intake.service';
@Controller('request-intake')
export class RequestIntakeController {
    constructor(private readonly requestIntakeService: RequestIntakeService){}
    @Post('analyze')
    analyze(@Body() body: AnalyzeRequestDto){
        return this.requestIntakeService.analyze(body.text);
    }
}
