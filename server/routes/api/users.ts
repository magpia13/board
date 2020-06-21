import express from 'express'
import User from '../../models/User'
import bcrypt from 'bcryptjs'
import {Request} from 'express'
import {keys} from '../../config/keys'
import jwt from 'jsonwebtoken'
import sendMail from '../../utils/sendEmail'
interface IRequest extends Request {
  req: {body: {password2: string}}
}

const {check, validationResult, body} = require('express-validator')
const router = express.Router()

router.post(
  '/register',
  [
    check('firstName', 'First name is required')
      .not()
      .isEmpty(),
    check('lastName', 'Last name is required')
      .not()
      .isEmpty(),
    check('email')
      .exists({checkFalsy: true})
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Email is incorrect'),

    check('password')
      .isLength({min: 6})
      .withMessage('Please enter a password with 6 or more characters')
      .bail()
      .custom((value: any, {req}: IRequest) => {
        if (value !== req.body.password2) {
          // trow error if passwords do not match
          throw new Error("Passwords don't match")
        } else {
          return value
        }
      }),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()})
    }
    const {firstName, lastName, email, password} = req.body
    try {
      let user = await User.findOne({email})

      if (user) res.status(400).json({errors: [{msg: 'User already exists'}]})

      user = new User({firstName, lastName, email, password})
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)

      await user.save()

      jwt.sign(
        {user: user.id},
        keys.secret,
        {
          expiresIn: '1d',
        },
        (err, emailToken) => {
          const url = `${keys.url}/confirmation/${emailToken}`

          sendMail(
            user.email,
            'Confirm',
            `Confirm: <a href="${url}">${url}</a>`
          )
        }
      )

      res.json(user)
    } catch (err) {
      console.log(err.message)
      res.status(500).send('Server error')
    }
  }
)

export default router
