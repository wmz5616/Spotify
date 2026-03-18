import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('认证')
@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    @ApiOperation({ summary: '用户注册' })
    @ApiResponse({ status: 201, description: '注册成功', type: AuthResponseDto })
    @ApiResponse({ status: 409, description: '邮箱或用户名已存在' })
    async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '用户登录' })
    @ApiResponse({ status: 200, description: '登录成功', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: '邮箱或密码错误' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: '获取当前用户信息' })
    @ApiResponse({ status: 200, description: '获取成功' })
    @ApiResponse({ status: 401, description: '未授权' })
    async getMe(
        @CurrentUser() user: { id: number; email: string },
    ) {
        return this.authService.getProfile(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: '用户登出' })
    @ApiResponse({ status: 200, description: '登出成功' })
    async logout() {
        return { message: '登出成功' };
    }
}
