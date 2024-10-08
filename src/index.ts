interface param {
  /** 输入宽 */
  inw: number;
  /** 输入高 */
  inh: number;
  /** 输出宽 */
  outw: number;
  /** 输出高 */
  outh: number;
  /** 输入窗口转化到输出窗口后最小的宽高尺寸；默认值:1 */
  minWH?: number;
  /** 输入窗口转化到输出窗口后最大的宽高尺寸；默认值:Infinity */
  maxWH?: number;
}

class TransferToWindow {
  /** 输入宽 */
  inw: number;
  /** 输入高 */
  inh: number;
  /** 输出宽 */
  outw: number;
  /** 输出高 */
  outh: number;
  /** 输入窗口转化到输出窗口后最小的宽高尺寸 */
  minWH: number;
  /** 输入窗口转化到输出窗口后最大的宽高尺寸 */
  maxWH: number;
  /** 最小缩放比例 */
  minScale: number;
  /** 最大缩放比例 */
  maxScale: number;
  /**
   * 输入->输出的变化矩阵
   * [scale, 0, 0, 0, scale, 0, dx, dy, 1]
   */
  scale!: number;
  dx!: number;
  dy!: number;
  /**
   * 输出->输入的变化矩阵
   * [invScale, 0, 0, 0, invScale, 0, invDx, invDy, 1]
   */
  invScale!: number;
  invDx!: number;
  invDy!: number;
  /**
   * 
   * @param param 参数列表
   * @param silent 是否计算输入输出窗口之间的变化矩阵
   */
  constructor(param: param, silent?: boolean) {
    const { inw, inh, outw, outh, minWH, maxWH } = param;
    this.inw = inw;
    this.inh = inh;
    this.outw = outw;
    this.outh = outh;
    this.minWH = minWH || 1;
    this.maxWH = maxWH || Infinity;
    this.minScale = this.maxScale = 1;
    silent || this.resize();
  }

  /**
   * 平移
   * @param dx 
   * @param dy 
   */
  translate(dx: number, dy: number) {
    this.updateMatrix(
      this.scale,
      this.dx + dx,
      this.dy + dy,
    );
  }

  /**
   * 以(cx,cy)为中心缩放ratio比例
   * @param cx 
   * @param cy 
   * @param ratio 
   */
  zoom(cx: number, cy: number, ratio: number) {
    const { dx, dy, scale, minScale, maxScale } = this;
    if (scale * ratio > maxScale) {
      ratio = maxScale / scale;
    } else if (scale * ratio < minScale) {
      ratio = minScale / scale;
    }
    this.updateMatrix(
      scale * ratio,
      (dx - cx) * ratio + cx,
      (dy - cy) * ratio + cy,
    );
  }

  /**
   * 将输入数据完整放置于输出窗口的正中间；效果类似于CSS效果：
   *    background-size: contain;
   *    background-repeat: no-repeat;
   *    background-position: center; 
   */
  resize() {
    const { outw, outh, inw, inh, minWH, maxWH } = this;
    let scale;
    if (outw / outh > inw / inh) {
      scale = outh / inh;
    } else {
      scale = outw / inw;
    }

    this.minScale = Math.min(scale, minWH / inw, minWH / inh);
    this.maxScale = Math.max(scale, maxWH / inw, maxWH / inh);

    this.updateMatrix(
      scale,
      (outw - inw * scale) / 2,
      (outh - inh * scale) / 2,
    );
  }

  /**
   * 将输入窗口的roi:[x,y,width,heigght]区域放置于输出窗口正中间
   * @param x 起点位置x
   * @param y 起点位置y
   * @param width 宽
   * @param height 高
   * @param margin roi的margin值
   */
  scrollToRect(x: number, y: number, width: number, height: number, margin?: number) {
    margin = margin || 100;
    const { outw, outh } = this;
    this.scale = 1;
    this.dx = outw / 2 - x - width / 2
    this.dy = outh / 2 - y - height / 2
    const scale = Math.min(
      outw / (width + margin),
      outh / (height + margin),
    )
    this.zoom(outw / 2, outh / 2, scale);
  }

  /**
   * 更新输入->输出矩阵
   */
  updateMatrix(scale: number, dx: number, dy: number) {
    this.scale = scale;
    this.dx = dx;
    this.dy = dy;
    this.updateInvMatrix();
  }

  /**
   * 更新输出->输入矩阵
   */
  private updateInvMatrix() {
    this.invScale = 1 / this.scale;
    this.invDx = -this.dx / this.scale;
    this.invDy = -this.dy / this.scale;
  }

  /**
   * 坐标(x,y)是否位于输入视框内
   */
  inCoorIsIn(x: number, y: number): boolean {
    const { inw, inh } = this;
    return x >= 0 && x < inw && y >= 0 && y < inh;
  }

  /**
   * 坐标(x,y)是否位于输出视框内
   */
  outCoorIsIn(x: number, y: number): boolean {
    const { outw, outh } = this;
    return x >= 0 && x < outw && y >= 0 && y < outh;
  }

  /**
   * 转化坐标组(x,y,...)
   */
  private transCoors(coors: number[], scale: number, dx: number, dy: number): number[] {
    const result = [];
    for (let i = 1; i < coors.length; i = i + 2) {
      result.push(
        ~~((coors[i - 1]) * scale + dx),
        ~~((coors[i]) * scale + dy),
      );
    }
    return result;
  }

  /**
   * 将输入坐标组(x,y,...)转化为输出坐标组
   */
  transInToOut(coors: number[]): number[] {
    const { scale, dx, dy } = this;
    return this.transCoors(coors, scale, dx, dy);
  }

  /**
   * 将输出坐标组(x,y,...)转化为输入坐标组
   */
  transOutToIn(coors: number[]): number[] {
    const { invScale, invDx, invDy } = this;
    return this.transCoors(coors, invScale, invDx, invDy);
  }

}

export { TransferToWindow }